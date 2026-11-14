
// =====================================
// SCOTLAND YARD – ONLINE SPIELFUNKTION
// =====================================

async function neuWuerfeln() {

    // Prüfen, ob die Online-Funktion geladen wurde
    if (typeof onlineNeuWuerfeln !== "function") {
        alert("Die Online-Spielverbindung ist noch nicht eingerichtet.");
        return;
    }

    // Neue gemeinsame Spielrunde anfordern
    await onlineNeuWuerfeln();
}


// =====================================
// SCOTLAND YARD – MYSTERY SOUNDTRACK
// =====================================

let audioContext;
let masterGain;
let musikLaeuft = false;
let musikTimer = null;
let melodieIndex = 0;

// Eine düstere Melodie in D-Moll
const melodie = [
    293.66, 349.23, 440.00, 392.00,
    349.23, 293.66, 261.63, 293.66,
    220.00, 261.63, 293.66, 261.63,
    220.00, 196.00, 220.00, 261.63
];

// Noten abspielen
function noteSpielen(frequenz, dauer, lautstaerke, form) {

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = form;
    oscillator.frequency.value = frequenz;

    const jetzt = audioContext.currentTime;

    gain.gain.setValueAtTime(0.001, jetzt);
    gain.gain.linearRampToValueAtTime(
        lautstaerke,
        jetzt + 0.08
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        jetzt + dauer
    );

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(jetzt);
    oscillator.stop(jetzt + dauer + 0.05);
}

// Einen Takt der Musik spielen
function taktSpielen() {

    const note = melodie[melodieIndex % melodie.length];

    // Hauptmelodie
    noteSpielen(note, 0.8, 0.13, "triangle");

    // Tiefer Bass alle vier Schritte
    if (melodieIndex % 4 === 0) {

        const bassNoten = [73.42, 65.41, 55.00, 65.41];

        const bass = bassNoten[
            Math.floor(melodieIndex / 4) % 4
        ];

        noteSpielen(bass, 1.8, 0.20, "sine");
    }

    // Gelegentliche hohe Klavier-artige Akzente
    if (melodieIndex % 4 === 2) {
        noteSpielen(note * 2, 0.45, 0.045, "sine");
    }

    melodieIndex++;
}

// Musik starten und pausieren
async function musikUmschalten() {

    if (!audioContext) {

        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

        masterGain = audioContext.createGain();

        const filter = audioContext.createBiquadFilter();

        filter.type = "lowpass";
        filter.frequency.value = 1200;

        masterGain.gain.value = 0.7;

        masterGain.connect(filter);
        filter.connect(audioContext.destination);
    }

    if (!musikLaeuft) {

        await audioContext.resume();

        musikLaeuft = true;

        taktSpielen();

        musikTimer = setInterval(taktSpielen, 650);

        document.getElementById("musikButton").textContent =
            "Ⅱ MUSIK PAUSIEREN";

    } else {

        clearInterval(musikTimer);
        musikTimer = null;

        await audioContext.suspend();

        musikLaeuft = false;

        document.getElementById("musikButton").textContent =
            "♫ MUSIK STARTEN";
    }
}
