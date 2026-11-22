
// =====================================
// SCOTLAND YARD – ONLINE-SPIELVERWALTUNG
// =====================================

let onlineSpielInterval = null;
let ausgewaehltesPasswort = "";

// =====================================
// SUPABASE-ANFRAGE
// =====================================

async function onlineAnfrage(body) {
    const { data, error } =
        await window.supabaseClient.functions.invoke(
            "scotland-yard",
            { body }
        );

    if (error) {
        let details = error.message;

        if (error.context) {
            try {
                const text = await error.context.clone().text();
                const parsed = JSON.parse(text);
                details = parsed.error || parsed.message || details;
            } catch (e) {
                // Ursprüngliche Fehlermeldung verwenden
            }
        }

        throw new Error(details);
    }

    if (!data || !data.success) {
        throw new Error(
            data?.error || "Keine gültige Serverantwort."
        );
    }

    return data;
}

// =====================================
// SPIELER ANMELDEN
// =====================================

async function spielerAnmelden(name, password, role) {
    if (!window.supabaseClient) {
        throw new Error("Supabase wurde nicht richtig geladen.");
    }

    const data = await onlineAnfrage({
        action: "login",
        name,
        password,
        role
    });

    localStorage.setItem("scotlandYardPlayer", data.playerName);
    localStorage.setItem("scotlandYardSession", data.sessionToken);
    localStorage.setItem("scotlandYardRole", data.role);

    return data;
}

// =====================================
// ROLLE AKTUALISIEREN
// =====================================

function rolleAktualisieren(rolle) {
    if (!rolle) return;

    localStorage.setItem("scotlandYardRole", rolle);

    const anzeige = document.getElementById("rollenAnzeige");
    const misterxBereich = document.getElementById("misterxBereich");

    if (anzeige) {
        anzeige.textContent =
            rolle === "mr_x"
                ? "🎩 DU BIST MR. X"
                : "🕵️ DU BIST DETEKTIV";
    }

    if (misterxBereich) {
        misterxBereich.hidden = rolle !== "mr_x";
    }
}

// =====================================
// POSITIONEN ZURÜCKSETZEN
// =====================================

function spielstandZuruecksetzen() {
    const ids = [
        "positionGelb",
        "positionSchwarz",
        "positionGruen",
        "positionRot",
        "misterxStart",
        "misterxZiel"
    ];

    ids.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = "?";
        }
    });

    const misterxBereich =
        document.getElementById("misterxBereich");

    if (misterxBereich) {
        misterxBereich.hidden =
            localStorage.getItem("scotlandYardRole") !== "mr_x";
    }
}

// =====================================
// POSITIONEN ANZEIGEN
// =====================================

function onlineSpielstandAnzeigen(positionen) {
    if (!positionen) return;

    rolleAktualisieren(positionen.rolle);

    const detektivBereich =
        document.getElementById("detektivBereich");

    const misterxBereich =
        document.getElementById("misterxBereich");

    if (detektivBereich) {
        detektivBereich.hidden = false;
    }

    if (Array.isArray(positionen.detektive)) {
        const gelbSchwarz = positionen.detektive[0];
        const gruenRot = positionen.detektive[1];

        if (gelbSchwarz) {
            document.getElementById(
                "detektivGelbName"
            ).textContent = gelbSchwarz.spieler.toUpperCase();

            document.getElementById(
                "positionGelb"
            ).textContent = gelbSchwarz.gelb ?? "?";

            document.getElementById(
                "positionSchwarz"
            ).textContent = gelbSchwarz.schwarz ?? "?";
        }

        if (gruenRot) {
            document.getElementById(
                "detektivGruenName"
            ).textContent = gruenRot.spieler.toUpperCase();

            document.getElementById(
                "positionGruen"
            ).textContent = gruenRot.gruen ?? "?";

            document.getElementById(
                "positionRot"
            ).textContent = gruenRot.rot ?? "?";
        }
    }

    if (positionen.rolle === "mr_x") {
        misterxBereich.hidden = false;

        document.getElementById(
            "misterxStart"
        ).textContent = positionen.misterxStart ?? "?";

        document.getElementById(
            "misterxZiel"
        ).textContent = positionen.misterxZiel ?? "?";

    } else {
        misterxBereich.hidden = true;
    }
}

// =====================================
// SPIELSTAND LADEN
// =====================================

async function onlineSpielstandLaden() {
    const name = localStorage.getItem("scotlandYardPlayer");
    const sessionToken = localStorage.getItem("scotlandYardSession");

    if (!name || !sessionToken) return;

    const data = await onlineAnfrage({
        action: "get_state",
        name,
        sessionToken
    });

    if (data.role) {
        rolleAktualisieren(data.role);
    }

    if (data.positions) {
        onlineSpielstandAnzeigen(data.positions);
    } else {
        spielstandZuruecksetzen();
    }
}

// =====================================
// AUTOMATISCHE SYNCHRONISIERUNG
// =====================================

function onlineSynchronisierungStarten() {
    if (onlineSpielInterval) {
        clearInterval(onlineSpielInterval);
    }

    onlineSpielstandLaden().catch(console.error);

    onlineSpielInterval = setInterval(
        async function() {
            try {
                await onlineSpielstandLaden();
            } catch (error) {
                console.error(
                    "Synchronisierungsfehler:",
                    error
                );
            }
        },
        3000
    );
}

// =====================================
// NEUE RUNDE STARTEN
// =====================================

async function onlineNeueRundeStarten() {
    const name = localStorage.getItem("scotlandYardPlayer");
    const sessionToken = localStorage.getItem("scotlandYardSession");

    const mrXName = document.getElementById("neuerMrX").value;

    const button = document.getElementById("neueRundeButton");
    const meldung = document.getElementById("neueRundeMeldung");

    if (!name || !sessionToken) {
        alert("Bitte zuerst anmelden.");
        return;
    }

    if (!mrXName) {
        meldung.textContent =
            "Bitte zuerst den neuen Mister X auswählen.";
        return;
    }

    const bestaetigt = confirm(
        "Neue Runde starten?\n\n" +
        mrXName + " wird Mister X.\n\n" +
        "Die bisherigen Positionen werden zurückgesetzt."
    );

    if (!bestaetigt) return;

    button.disabled = true;
    button.textContent = "NEUE RUNDE WIRD GESTARTET...";
    meldung.textContent = "Rollen werden neu verteilt...";

    try {
        const data = await onlineAnfrage({
            action: "new_round",
            name,
            sessionToken,
            mrXName
        });

        if (data.role) {
            rolleAktualisieren(data.role);
        }

        spielstandZuruecksetzen();

        meldung.textContent =
            "Neue Runde gestartet! " +
            mrXName + " ist Mister X.";

        await onlineSpielstandLaden();

    } catch (error) {
        console.error("Fehler beim Rundenwechsel:", error);

        meldung.textContent =
            "Fehler: " + error.message;

    } finally {
        button.disabled = false;
        button.textContent = "NEUE RUNDE STARTEN";
    }
}

// =====================================
// POSITIONEN NEU AUSWÜRFELN
// =====================================

async function onlineNeuWuerfeln() {
    const name = localStorage.getItem("scotlandYardPlayer");
    const sessionToken = localStorage.getItem("scotlandYardSession");

    if (!name || !sessionToken) {
        alert("Bitte zuerst anmelden.");
        return;
    }

    const button = document.getElementById("neuWuerfelnButton");

    if (button) {
        button.disabled = true;
        button.textContent = "POSITIONEN WERDEN GEZOGEN...";
    }

    try {
        const data = await onlineAnfrage({
            action: "roll",
            name,
            sessionToken
        });

        if (data.positions) {
            onlineSpielstandAnzeigen(data.positions);
        }

        console.log("Neue Positionen wurden ausgelost.");

    } catch (error) {
        console.error("Fehler beim Auswürfeln:", error);

        alert(
            "Das Auswürfeln hat nicht funktioniert: " +
            error.message
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "NEU AUSWÜRFELN";
        }
    }
}

// =====================================
// SCHRITT 1: NAME UND PASSWORT PRÜFEN
// =====================================

const anmeldeFormular =
    document.getElementById("anmeldeFormular");

if (anmeldeFormular) {
    anmeldeFormular.addEventListener(
        "submit",
        async function(event) {
            event.preventDefault();

            const name =
                document.getElementById("spielerName").value;

            const password =
                document.getElementById("spielPasswort").value;

            const meldung =
                document.getElementById("anmeldeMeldung");

            const button =
                document.getElementById("anmeldeButton");

            meldung.textContent =
                "Anmeldedaten werden überprüft...";

            button.disabled = true;

            try {
                await onlineAnfrage({
                    action: "verify",
                    name,
                    password
                });

                ausgewaehltesPasswort = password;

                document.getElementById(
                    "anmeldedatenBereich"
                ).hidden = true;

                document.getElementById(
                    "rollenwahlBereich"
                ).hidden = false;

                meldung.textContent =
                    "Anmeldedaten korrekt. Bitte wähle deine Rolle.";

            } catch (error) {
                meldung.textContent =
                    "Fehler: " + error.message;

                console.error(error);

            } finally {
                button.disabled = false;
            }
        }
    );
}

// =====================================
// SCHRITT 2: ROLLE BESTÄTIGEN
// =====================================

const rolleBestaetigenButton =
    document.getElementById("rolleBestaetigenButton");

if (rolleBestaetigenButton) {
    rolleBestaetigenButton.addEventListener(
        "click",
        async function() {
            const name =
                document.getElementById("spielerName").value;

            const role =
                document.getElementById("spielerRolle").value;

            const meldung =
                document.getElementById("anmeldeMeldung");

            if (!role) {
                meldung.textContent =
                    "Bitte zuerst eine Rolle auswählen.";
                return;
            }

            rolleBestaetigenButton.disabled = true;

            meldung.textContent =
                "Rolle wird gespeichert...";

            try {
                const spieler = await spielerAnmelden(
                    name,
                    ausgewaehltesPasswort,
                    role
                );

                document.getElementById(
                    "angemeldeterSpieler"
                ).textContent = spieler.playerName;

                rolleAktualisieren(spieler.role);

                document.getElementById(
                    "anmeldung"
                ).hidden = true;

                document.getElementById(
                    "spielbereich"
                ).hidden = false;

                document.getElementById(
                    "detektivBereich"
                ).hidden = false;

                onlineSynchronisierungStarten();

            } catch (error) {
                meldung.textContent =
                    "Fehler: " + error.message;

                console.error(
                    "Anmeldung fehlgeschlagen:",
                    error
                );

            } finally {
                rolleBestaetigenButton.disabled = false;
            }
        }
    );
}
