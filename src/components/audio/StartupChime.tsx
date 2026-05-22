
"use client";

import { useEffect } from "react";
import * as Tone from "tone";

export function StartupChime() {
  useEffect(() => {
    const playChime = async () => {
      await Tone.start();
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      synth.set({
        envelope: {
          attack: 0.1,
          decay: 0.5,
          sustain: 0.2,
          release: 2,
        },
        oscillator: {
          type: "sine",
        },
      });

      // A simple futuristic harmonic chime sequence
      const now = Tone.now();
      synth.triggerAttackRelease("C4", "3s", now);
      synth.triggerAttackRelease("E4", "3s", now + 0.1);
      synth.triggerAttackRelease("G4", "3s", now + 0.2);
      synth.triggerAttackRelease("C5", "3s", now + 0.3);
      
      // Add a bit of reverb for ambient feel
      const reverb = new Tone.Reverb(2).toDestination();
      synth.connect(reverb);
    };

    // We trigger on interaction or first mount if allowed
    const handler = () => {
      playChime();
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };

    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return null;
}
