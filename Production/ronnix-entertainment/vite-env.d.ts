/**
 * vite-env.d.ts — Vite-Client-Typen + Buildzeit-Konstanten (Deklaration).
 *
 * Feature: bindet `vite/client`-Typen ein und deklariert `__BUILD_ID__`
 * (wird in `vite.config.ts` per `define` mit einem Zeitstempel je Build belegt).
 * `utils/appConfig.ts` liest die Konstante als `BUILD_ID` und versioniert damit
 * volatile localStorage-Caches (Release-scharfe Invalidierung).
 * Gehört NICHT hierher: Laufzeitwerte (siehe `vite.config.ts`, `utils/appConfig.ts`).
 */

/// <reference types="vite/client" />

/** Eindeutige ID des laufenden Builds (Format `YYYYMMDDHHmmss`, UTC). */
declare const __BUILD_ID__: string;
