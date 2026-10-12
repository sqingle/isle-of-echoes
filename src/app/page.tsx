import Link from "next/link";
import { IslandMap } from "@/components/IslandMap";

export default function Title() {
  return (
    <main className="bg-abyss">
      <section className="grain relative isolate flex min-h-dvh flex-col overflow-hidden">
        <div className="push-in absolute inset-0 -z-20">
          <IslandMap interactive={false} fit="slice" />
        </div>
        <div className="vignette absolute inset-0 -z-10" />

        <div className="mx-auto w-full max-w-6xl px-6 pt-10 text-center md:pt-14">
          <p className="eyebrow rise">An informal phonological screening · ages 4–14</p>
          <h1
            className="title-wash rise mt-4 text-[clamp(2.2rem,7.2vw,5.6rem)] leading-[1.02] tracking-[0.12em] uppercase"
            style={{ animationDelay: "0.15s" }}
          >
            The Isle
            <span className="block">of Echoes</span>
          </h1>
        </div>

        <div className="flex-1" />

        <div className="mx-auto grid w-full max-w-6xl items-end gap-6 px-6 pb-8 md:grid-cols-[1fr_auto] md:pb-12">
          <p
            className="rise max-w-xl rounded bg-gradient-to-r from-abyss/75 to-abyss/20 p-4 text-xl text-bone italic md:text-2xl"
            style={{ animationDelay: "0.4s" }}
          >
            Eight realms wait on a silent island. In each, a Keeper and a young traveler trade sounds, words and numbers, and the island
            answers back.
          </p>
          <div className="rise flex flex-col gap-3 sm:flex-row md:flex-col" style={{ animationDelay: "0.6s" }}>
            <Link href="/setup" className="btn btn-brass">
              Step onto the island
            </Link>
            <a href="#keeper-note" className="btn btn-stone bg-abyss/50 backdrop-blur">
              Note for the Keeper
            </a>
          </div>
        </div>
      </section>

      <section id="keeper-note" className="mx-auto w-full max-w-3xl px-5 py-12">
        <div className="plaque p-6 md:p-8">
          <p className="eyebrow">Note for the Keeper</p>
          <p className="mt-3 text-lg leading-relaxed text-parchment/90">
            This is an <strong className="text-gold">illustrative, non-normed, non-validated</strong> item bank. It is not the CTOPP-2 and
            not a diagnostic instrument. Never use it alone to diagnose dyslexia or to support an IEP/504 decision. Its role is to help a
            trained adult organise observations and decide whether a comprehensive evaluation is warranted.
          </p>
          <p className="mt-3 text-base text-stone">
            One adult (the Keeper) reads each item aloud and taps whether the child answered correctly. Nothing is saved or sent anywhere:
            results live only in this browser tab until it is closed.
          </p>
        </div>
      </section>
    </main>
  );
}
