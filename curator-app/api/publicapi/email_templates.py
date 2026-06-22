"""Plain-text email bodies for Curator transactional mail."""


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
