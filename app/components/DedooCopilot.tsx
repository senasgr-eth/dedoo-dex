import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAccount } from "@orderly.network/hooks";
import { getRuntimeConfig } from "@/utils/runtime-config";
import "./DedooCopilot.css";

const DEFAULT_SYMBOL = "PERP_BTC_USDC";

/** Extract an Orderly symbol from the current /perp/:symbol route. */
function symbolFromPath(pathname: string): string {
  const match = pathname.match(/^\/perp\/([^/?#]+)/);
  if (!match) return DEFAULT_SYMBOL;

  const raw = decodeURIComponent(match[1]);
  if (raw.startsWith("PERP_")) return raw;

  const base = raw
    .replace(/_USDC$/i, "")
    .split("-")[0]
    .replace(/_USDC$/i, "")
    .toUpperCase();

  return base ? `PERP_${base}_USDC` : DEFAULT_SYMBOL;
}

export default function DedooCopilot() {
  const { account } = useAccount();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [frameSrc, setFrameSrc] = useState("");
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [guidePending, setGuidePending] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const productName = getRuntimeConfig("VITE_COPILOT_NAME") || "Dedoo Copilot";
  const enabled = getRuntimeConfig("VITE_COPILOT_ENABLED") !== "false";
  const baseUrl = (
    getRuntimeConfig("VITE_COPILOT_URL") || "https://assistant.dedoo.xyz"
  ).replace(/\/+$/, "");
  const broker = getRuntimeConfig("VITE_ORDERLY_BROKER_ID") || "";
  const symbol = symbolFromPath(location.pathname);
  const accountAddress = account?.address || "";
  const address = accountAddress.startsWith("0x") ? accountAddress : "";

  const assistantOrigin = useMemo(() => {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return "";
    }
  }, [baseUrl]);

  const src = useMemo(() => {
    const query = new URLSearchParams({
      embed: "1",
      panel: "1",
      auto: "1",
      symbol,
    });

    if (broker) query.set("broker", broker);
    if (address) query.set("address", address);

    return `${baseUrl}/app?${query.toString()}`;
  }, [address, baseUrl, broker, symbol]);

  const openPanel = useCallback(() => {
    setFrameSrc(src);
    setOpen(true);
  }, [src]);

  const closePanel = useCallback(() => setOpen(false), []);

  const requestGuide = useCallback(() => {
    if (!frameLoaded) {
      setGuidePending(true);
      return;
    }
    frameRef.current?.contentWindow?.postMessage(
      { type: "dedoo:guide" },
      assistantOrigin || "*",
    );
  }, [assistantOrigin, frameLoaded]);

  useEffect(() => {
    if (open) setFrameSrc(src);
  }, [open, src]);

  useEffect(() => {
    document.documentElement.classList.toggle("dc-side-open", open);
    return () => document.documentElement.classList.remove("dc-side-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    const onMessage = (event: MessageEvent) => {
      if (assistantOrigin && event.origin !== assistantOrigin) return;
      const data = event.data as { type?: string } | null;
      if (data?.type === "dedoo:close") closePanel();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
    };
  }, [assistantOrigin, closePanel, open]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        className={`dc-launch${open ? " is-open" : ""}`}
        onClick={open ? closePanel : openPanel}
        aria-label={open ? `Close ${productName}` : `Open ${productName}`}
        aria-expanded={open}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 17.5l5.2-6.2 3.9 3.1L17 6l4 5.2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{productName}</span>
        <span className="dc-pulse" />
      </button>

      {frameSrc && (
        <>
          <div
            className={`dc-backdrop${open ? " is-open" : ""}`}
            onClick={closePanel}
            aria-hidden="true"
          />
          <aside
            className={`dc-side${open ? " is-open" : ""}`}
            aria-label={`${productName} forecast and risk assistant`}
            aria-hidden={!open}
          >
            <header className="dc-head">
              <div className="dc-brand">
                <span className="dc-pulse" />
                <span>{productName}</span>
                <span className="dc-sub">forecast &amp; risk</span>
              </div>
              <div className="dc-head-actions">
                <button
                  type="button"
                  className="dc-guide"
                  onClick={requestGuide}
                  aria-label={`How to use ${productName}`}
                >
                  Guide
                </button>
                <button
                  type="button"
                  className="dc-close"
                  onClick={closePanel}
                  aria-label={`Close ${productName}`}
                >
                  &times;
                </button>
              </div>
            </header>
            <iframe
              ref={frameRef}
              className="dc-frame"
              src={frameSrc}
              title={`${productName} forecast and risk assistant`}
              allow="clipboard-write"
              onLoad={() => {
                setFrameLoaded(true);
                if (!guidePending) return;
                frameRef.current?.contentWindow?.postMessage(
                  { type: "dedoo:guide" },
                  assistantOrigin || "*",
                );
                setGuidePending(false);
              }}
            />
          </aside>
        </>
      )}
    </>
  );
}
