import type { ShopOrderStatus, ShopProduct } from "../../generated/prisma";
import { prisma } from "../db/prisma";
import { NotFoundError, ValidationError } from "../errors";
import { stripHtmlTags } from "../text";
import { parseOrThrow } from "../validation/parse";
import {
  shopOrderIdSchema,
  shopOrderInputSchema,
  shopOrderStatusSchema,
  shopProductIdSchema,
  shopProductInputSchema,
  type ShopOrderInput,
  type ShopProductInput,
} from "../validation/shop";
import { salePrice } from "./pricing";

export type ShopProductCard = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number | null;
  salePrice: number;
  image1: string | null;
  image2: string | null;
  active: boolean;
  sortOrder: number;
};

function moneyNumber(value: { toString(): string } | number | string): number {
  return Math.round(Number(value) * 100) / 100;
}

function moneyValue(value: number): string {
  return value.toFixed(2);
}

export function toProductCard(product: ShopProduct): ShopProductCard {
  const price = moneyNumber(product.price);
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price,
    discountPercent: product.discountPercent,
    salePrice: salePrice(price, product.discountPercent),
    image1: product.image1,
    image2: product.image2,
    active: product.active,
    sortOrder: product.sortOrder,
  };
}

export async function getShopProducts(includeInactive = false) {
  const products = await prisma.shopProduct.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return products.map(toProductCard);
}

export async function getShopProduct(id: string) {
  const productId = parseOrThrow(shopProductIdSchema, id);
  const product = await prisma.shopProduct.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError("Proizvod nije pronađen");
  }
  return toProductCard(product);
}

export async function getShopProductAdmin(id: string) {
  return getShopProduct(id);
}

function productData(input: ShopProductInput) {
  const data = parseOrThrow(shopProductInputSchema, input);
  return {
    name: stripHtmlTags(data.name).trim(),
    description: data.description ? stripHtmlTags(data.description).trim() || null : null,
    price: moneyValue(data.price),
    discountPercent: data.discountPercent ?? null,
    image1: data.image1 ?? null,
    image2: data.image2 ?? null,
    active: data.active ?? true,
    sortOrder: data.sortOrder ?? 0,
  };
}

export async function createShopProduct(input: ShopProductInput) {
  return toProductCard(await prisma.shopProduct.create({ data: productData(input) }));
}

export async function updateShopProduct(id: string, input: ShopProductInput) {
  const productId = parseOrThrow(shopProductIdSchema, id);
  await getShopProduct(productId);
  return toProductCard(
    await prisma.shopProduct.update({
      where: { id: productId },
      data: productData(input),
    }),
  );
}

export async function deleteShopProduct(id: string) {
  const productId = parseOrThrow(shopProductIdSchema, id);
  const orders = await prisma.shopOrder.count({ where: { productId } });
  if (orders > 0) {
    throw new ValidationError("Proizvod ima narudžbe. Deaktivirajte ga umjesto brisanja.");
  }
  await prisma.shopProduct.delete({ where: { id: productId } });
}

export async function createShopOrder(input: ShopOrderInput) {
  const data = parseOrThrow(shopOrderInputSchema, input);
  const product = await prisma.shopProduct.findUnique({ where: { id: data.productId } });
  if (!product || !product.active) {
    throw new ValidationError("Proizvod nije dostupan");
  }

  const unit = salePrice(moneyNumber(product.price), product.discountPercent);
  const total = salePrice(unit * data.quantity, null);

  return prisma.shopOrder.create({
    data: {
      productId: product.id,
      productName: product.name,
      unitPrice: moneyValue(unit),
      quantity: data.quantity,
      totalPrice: moneyValue(total),
      firstName: stripHtmlTags(data.firstName).trim(),
      lastName: stripHtmlTags(data.lastName).trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      address: stripHtmlTags(data.address).trim(),
    },
  });
}

export async function getShopOrders() {
  const orders = await prisma.shopOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true, active: true } } },
  });
  return orders.map((order) => ({
    ...order,
    unitPrice: moneyNumber(order.unitPrice),
    totalPrice: moneyNumber(order.totalPrice),
  }));
}

export async function countNewShopOrders() {
  return prisma.shopOrder.count({ where: { status: "NEW" } });
}

export async function updateShopOrderStatus(id: string, status: ShopOrderStatus) {
  const orderId = parseOrThrow(shopOrderIdSchema, id);
  const next = parseOrThrow(shopOrderStatusSchema, status);
  const existing = await prisma.shopOrder.findUnique({ where: { id: orderId } });
  if (!existing) {
    throw new NotFoundError("Narudžba nije pronađena");
  }
  return prisma.shopOrder.update({
    where: { id: orderId },
    data: { status: next },
  });
}
