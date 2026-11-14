
 // =====================================
 // SCOTLAND YARD – ONLINE-ANMELDUNG
 // =====================================

async function spielerAnmelden(name, password) {

    // Prüfen, ob Supabase verbunden ist
    if (!window.supabaseClient) {
        throw new Error(
            "Supabase wurde nicht richtig geladen. Bitte supabase.js überprüfen."
        );
    }

    try {

        const { data, error } =
            await window.supabaseClient.functions.invoke(
                "scotland-yard",
                {
                    body: {
                        action: "login",
                        name: name,
                        password: password
                    }
                }
            );

        // Fehler von Supabase genauer auslesen
        if (error) {

            console.error("Supabase-Fehler:", error);

            let details = "";

            if (error.context) {
                try {
                    details = await error.context.clone().text();
                } catch (e) {
                    details = error.message;
                }
            }

            console.error("Serverantwort:", details);

            let meldung = error.message || "Unbekannter Fehler";

            if (details) {
                try {
                    const serverDaten = JSON.parse(details);
                    meldung += " – " +
                        (serverDaten.error || serverDaten.message || details);
                } catch (e) {
                    meldung += " – " + details;
                }
            }

            throw new Error(meldung);
        }

        // Prüfen, ob eine erfolgreiche Antwort vorliegt
        if (!data || !data.success) {
            throw new Error(
                data?.error || "Der Server hat die Anmeldung nicht bestätigt."
            );
        }

        // Sitzung auf diesem Gerät speichern
        localStorage.setItem(
            "scotlandYardPlayer",
            data.playerName
        );

        localStorage.setItem(
            "scotlandYardSession",
            data.sessionToken
        );

        return data;

    } catch (error) {

        console.error("Anmeldefehler:", error);
        throw error;

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

            // Normales Neuladen der Seite verhindern
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

                const spieler =
                    await spielerAnmelden(name, password);

                document.getElementById(
                    "angemeldeterSpieler"
                ).textContent = spieler.playerName;

                document.getElementById(
                    "anmeldung"
                ).hidden = true;

                document.getElementById(
                    "spielbereich"
                ).hidden = false;

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

} else {

    console.error(
        "Das Anmeldeformular wurde in index.html nicht gefunden."
    );

}
