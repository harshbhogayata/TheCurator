"""HTML + plain-text bodies for Curator transactional mail."""

from html import escape


def build_curator_email_body(
    *,
    greeting: str,
    paragraphs: list[str],
    action_label: str,
    action_url: str,
    footer: str | None = None,
) -> str:
    lines = [
        "THE CURATOR",
        "Independent journalism, distilled.",
        "",
        greeting,
        "",
    ]
    lines.extend(paragraphs)
    lines.extend(
        [
            "",
            action_label,
            action_url,
            "",
            "—",
            footer or "If you did not request this, you can safely ignore this email.",
            "",
            "The Curator",
            "https://thecuratorgroup.org",
        ]
    )
    return "\n".join(lines)


def build_curator_email_html(
    *,
    headline: str,
    greeting: str,
    paragraphs: list[str],
    action_label: str,
    action_url: str,
    footer: str | None = None,
) -> str:
  safe_footer = footer or "If you did not request this, you can safely ignore this email."
  body_html = "".join(f"<p style=\"margin:0 0 16px;\">{escape(p)}</p>" for p in paragraphs)

  return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(headline)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fbf9f3;font-family:Georgia,'Times New Roman',serif;color:#31332b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf9f3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:32px 28px;border:1px solid #e8e4d8;">
            <tr>
              <td style="font-family:system-ui,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5e6056;padding-bottom:8px;">
                The Curator
              </td>
            </tr>
            <tr>
              <td style="font-size:28px;line-height:1.25;font-weight:500;padding-bottom:12px;">
                {escape(headline)}
              </td>
            </tr>
            <tr>
              <td style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#5e6056;">
                <p style="margin:0 0 16px;">{escape(greeting)}</p>
                {body_html}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 20px;">
                <a href="{escape(action_url)}" style="display:inline-block;background:#0e0e0b;color:#e9e8e3;text-decoration:none;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;padding:14px 24px;border-radius:999px;">
                  {escape(action_label)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;color:#5e6056;border-top:1px solid #ece8dc;padding-top:16px;">
                <p style="margin:0 0 8px;">{escape(safe_footer)}</p>
                <p style="margin:0;">
                  <a href="https://thecuratorgroup.org" style="color:#31332b;">thecuratorgroup.org</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
