"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Footer() {
  const socialLinks = useQuery(api.writings.getSetting, { key: "socialMedia" });
  let parsedLinks: Record<string, string> = {};
  if (socialLinks) {
    try {
      parsedLinks = JSON.parse(socialLinks);
    } catch (e) {
      console.error("Failed to parse social media links:", e);
    }
  }

  const socialIcons: Record<string, string> = {
    twitter: "𝕏",
    instagram: "📷",
    facebook: "f",
    linkedin: "in",
    github: "⚙",
    website: "🌐",
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-info">
          <span>&copy; {new Date().getFullYear()} The Pen Book</span>
          <span>All rights reserved</span>
        </div>

        {/* Social media links */}
        {Object.entries(parsedLinks).filter(([_, url]) => typeof url === "string" && url.trim() !== "").length > 0 && (
          <div className="site-footer-social">
            {Object.entries(parsedLinks)
              .filter(([_, url]) => typeof url === "string" && url.trim() !== "")
              .map(([key, url]) => (
                <a
                  key={key}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                  aria-label={`Follow on ${key}`}
                >
                  {socialIcons[key] || key}
                </a>
              ))}
          </div>
        )}
      </div>
    </footer>
  );
}
