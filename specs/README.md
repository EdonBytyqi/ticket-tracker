# Specs

Dieses Projekt wird **spec-driven** entwickelt: Erst wird beschrieben, *was* gebaut wird und woran man
erkennt, dass es fertig ist. Dann folgt der Entwurf, dann die Aufgaben, dann der Code.

## Ablauf pro Feature

1. **requirements.md** – Was und warum. User Stories mit nummerierten Akzeptanzkriterien (AK).
   Jedes AK ist pruefbar ("Wenn ..., dann ...").
2. **design.md** – Wie. Datenmodell, API, betroffene Module, Entscheidungen mit Begruendung.
3. **tasks.md** – Kleine, abhakbare Schritte. Jede Aufgabe nennt die AK, die sie erfuellt.
4. **Code + Tests** – Jedes AK hat mindestens einen Test. Die Tabelle "Nachweis" in requirements.md
   verweist auf ihn.
5. **Review** – Spec und Code werden zusammen geprueft. Weicht der Code ab, wird zuerst die Spec angepasst.

Das passt gut zur Arbeit mit KI-Werkzeugen: Die Spec ist der Auftrag an den Agenten, die Akzeptanzkriterien
sind die Messlatte fuer das Review. Aendert sich eine Anforderung, aendert sich zuerst die Spec.

## Specs

| Nr. | Feature | Status |
| --- | --- | --- |
| 001 | [Ticket-Tracker Basis](001-ticket-tracker-baseline/requirements.md) | umgesetzt (Spec nachtraeglich erstellt) |

Neue Features bekommen die naechste Nummer und starten mit einer Kopie von [`_vorlage/`](_vorlage/).
