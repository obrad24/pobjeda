# Statistika igrača

Source of truth: naša Neon baza (`MatchPlayer`, `MatchGoal`, `MatchCard`). SportDC statistika igrača se **ne** koristi i **ne pretpostavlja** iz rezultata utakmice.

## Dva izvora, bez miješanja

| SportDC (sync) | Naša baza (admin unos) |
| --- | --- |
| Rezultat (`homeScore` / `awayScore`) | Sastav (`MatchPlayer`) |
| Raspored, kolo, stadion | Minute, ulazak, izlazak |
| Tabela lige | Golovi igrača (`MatchGoal`: minut, strijelac, asistent) |
| | Kartoni (`MatchCard`: igrač, minut, tip) |

`2:1` sa SportDC-a **nije** 2 gola za našeg napadača. Golovi postoje tek kad admin unese `MatchGoal` ili fallback brojač na `MatchPlayer`.

## Šta se računa

Po igraču, za aktivnu sezonu (filter: utakmice te sezone). Nema kolona `Player.goals` / `Player.appearances`.

| Metrika | Izvor |
| --- | --- |
| Nastupi | `COUNT(MatchPlayer)` |
| Minute | `SUM(MatchPlayer.minutes)` |
| Golovi | `COUNT(MatchGoal)` gdje je `playerId` strijelac i `ownGoal = false` |
| Asistencije | `COUNT(MatchGoal)` gdje je `assistPlayerId` i gol nije autogol |
| Žuti kartoni | `COUNT(MatchCard type=YELLOW)` + `SECOND_YELLOW` |
| Crveni kartoni | `COUNT(MatchCard type=RED)` + `SECOND_YELLOW` |

Javna `/statistika`, profil `/igraci/[slug]`, top liste i blok na početnoj koriste iste funkcije: `getPlayerStatistics` / `getSeasonPlayerStatistics` / `getTopScorers` / `getTopAssists` / `getTopAppearances`.

## Unos utakmice

Admin (`/admin/utakmice/[id]`) čuva sve odjednom preko `saveMatchStatistics`:

- sastav: starter, minuta ulaska, minuta izlaska, minute
- golovi: minut, strijelac, asistent (opciono), autogol
- kartoni: igrač, minut, tip (`YELLOW` / `RED` / `SECOND_YELLOW`)
- promašeni penali, minute primljenih golova, odbrane golmana

Ako minute nisu unesene: starter = 90 ili minuta izlaska; izmjena = 90 − ulazak.

Strijelac i asistent moraju biti u sastavu te utakmice. Autogol ne smije imati asistenciju. SportDC skor se **ne** mijenja ovim unosom.

Nakon čuvanja: `revalidatePath` za `/`, `/statistika`, `/fantasy`, `/igraci`, `/igraci/[slug]`, `/utakmice/[id]`. Fantasy bodovi se preračunavaju automatski (`recalculateMatchFantasy`). Prikaz statistike se računa iznova iz evenata, nije ručni zbir.

## Konflikt brojača vs eventi

`MatchPlayer.goals` / `assists` / kartoni postoje radi brzog unosa. Pravilo čitanja:

1. Ako utakmica ima `MatchGoal` redove, golovi/asistencije se uzimaju odatle
2. Inače fallback na `MatchPlayer.goals` / `assists`
3. Kartoni: `MatchCard` ima prednost nad `MatchPlayer.yellowCards` / `redCards`
4. Admin forma preferira evente; pri čuvanju evenata brojači se usklađuju sa njima

## Pozicije

`GK` Golman, `DF` Odbrana, `MF` Vezni, `WG` Krilo, `FW` Napadač.

Fantasy mapiranje: `GK`→GK, `DF`→DEF, `MF`/`WG`→MID, `FW`→FWD. Vidi [FANTASY.md](./FANTASY.md).

## Prazno stanje

Dok nema `MatchPlayer` unosa, UI pokazuje „Statistika će biti dostupna nakon prvih utakmica“, ne nule kao da je sezona odigrana. Nastup sa 0 golova prikazuje 0.

## CRUD igrača

Admin `/admin/igraci`: ime, prezime, godište, broj, pozicija, fotografija (URL), bivši klubovi, aktivan/neaktivan. Javni `/igraci` skriva neaktivne.
