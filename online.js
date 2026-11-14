
// =====================================
// SCOTLAND YARD – ONLINE-SPIELVERWALTUNG
// =====================================

let onlineSpielInterval = null;


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
                // Die ursprüngliche Fehlermeldung bleibt erhalten.
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

async function spielerAnmelden(name, password) {

    if (!window.supabaseClient) {
        throw new Error(
            "Supabase wurde nicht richtig geladen."
        );
    }

    const data = await onlineAnfrage({
        action: "login",
        name: name,
        password: password
    });

    localStorage.setItem(
        "scotlandYardPlayer",
        data.playerName
    );

    localStorage.setItem(
        "scotlandYardSession",
        data.sessionToken
    );

    return data;
}


// =====================================
// SPIELSTAND ANZEIGEN
// =====================================

function onlineSpielstandAnzeigen(positionen) {

    if (!positionen) return;

    document.getElementById("spieler1").textContent =
        positionen.spieler1;

    document.getElementById("spieler2").textContent =
        positionen.spieler2;

    document.getElementById("spieler3").textContent =
        positionen.spieler3;

    document.getElementById("spieler4").textContent =
        positionen.spieler4;

    document.getElementById("misterxStart").textContent =
        positionen.misterxStart;

    document.getElementById("misterxZiel").textContent =
        positionen.misterxZiel;
}


// =====================================
// AKTUELLEN SPIELSTAND ABRUFEN
// =====================================

async function onlineSpielstandLaden() {

    const name = localStorage.getItem(
        "scotlandYardPlayer"
    );

    const sessionToken = localStorage.getItem(
        "scotlandYardSession"
    );

    if (!name || !sessionToken) return;

    const data = await onlineAnfrage({
        action: "get_state",
        name: name,
        sessionToken: sessionToken
    });

    if (data.positions) {
        onlineSpielstandAnzeigen(data.positions);
    }
}


// =====================================
// AUTOMATISCHE SYNCHRONISIERUNG
// =====================================

function onlineSynchronisierungStarten() {

    if (onlineSpielInterval) {
        clearInterval(onlineSpielInterval);
    }

    // Sofort den aktuellen Spielstand laden
    onlineSpielstandLaden().catch(console.error);

    // Alle drei Sekunden aktualisieren
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
// NEUE SPIELRUNDE AUSWÜRFELN
// =====================================

async function onlineNeuWuerfeln() {

    const name = localStorage.getItem(
        "scotlandYardPlayer"
    );

    const sessionToken = localStorage.getItem(
        "scotlandYardSession"
    );

    if (!name || !sessionToken) {
        alert("Bitte zuerst anmelden.");
        return;
    }

    const button = document.querySelector(
        'button[onclick="neuWuerfeln()"]'
    );

    if (button) {
        button.disabled = true;
        button.textContent = "POSITIONEN WERDEN GEZOGEN...";
    }

    try {

        const data = await onlineAnfrage({
            action: "roll",
            name: name,
            sessionToken: sessionToken
        });

        // Neue Positionen sofort anzeigen
        onlineSpielstandAnzeigen(data.positions);

        console.log(
            "Neue Spielrunde:",
            data.positions
        );

    } catch (error) {

        console.error(
            "Fehler beim Auswürfeln:",
            error
        );

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
// ANMELDEFORMULAR
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
                "Anmeldung wird überprüft...";

            button.disabled = true;

            try {

                const spieler = await spielerAnmelden(
                    name,
                    password
                );

                document.getElementById(
                    "angemeldeterSpieler"
                ).textContent = spieler.playerName;

                document.getElementById(
                    "anmeldung"
                ).hidden = true;

                document.getElementById(
                    "spielbereich"
                ).hidden = false;

                // Gemeinsamen Spielstand laden
                onlineSynchronisierungStarten();

            } catch (error) {

                meldung.textContent =
                    "Fehler: " + error.message;

                console.error(
                    "Anmeldung fehlgeschlagen:",
                    error
                );

            } finally {

                button.disabled = false;

            }

        }
    );

}
