"""
Lean Vercel serverless backend for the SEOplus public demo.

Only serves the account-free flow: page audit + AI insights. GSC-connected
features are intentionally not included here (they need a persistent local
process for OAuth). Configure AI_API_KEY (and optionally AI_MODEL,
AI_BASE_URL) as Vercel environment variables.
"""
from __future__ import annotations

from flask import Flask, jsonify, request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import ipaddress
import os
import socket

import requests as http_requests
from openai import OpenAI

app = Flask(__name__)


class PageAuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.og_title = ""
        self.og_description = ""
        self.headings = {"h1": [], "h2": [], "h3": []}
        self.links = []
        self.images = []
        self.json_ld = []
        self.body_text = []
        self._active_tag = None
        self._active_heading = None
        self._active_script = None
        self._script_buffer = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        tag = tag.lower()
        if tag == "title":
            self._active_tag = "title"
        elif tag in self.headings:
            self._active_heading = tag
        elif tag == "script" and attributes.get("type", "").lower() == "application/ld+json":
            self._active_script = "json-ld"
            self._script_buffer = []
        elif tag == "meta":
            name = (attributes.get("name") or attributes.get("property") or "").lower()
            content = (attributes.get("content") or "").strip()
            if name == "description":
                self.description = content
            elif name == "robots":
                self.robots = content
            elif name == "og:title":
                self.og_title = content
            elif name == "og:description":
                self.og_description = content
        elif tag == "link" and (attributes.get("rel") or "").lower() == "canonical":
            self.canonical = attributes.get("href", "").strip()
        elif tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"].strip())
        elif tag == "img":
            self.images.append({"src": attributes.get("src", ""), "alt": attributes.get("alt", "")})

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self._active_tag = None
        elif tag in self.headings:
            self._active_heading = None
        elif tag == "script" and self._active_script == "json-ld":
            try:
                import json as json_module
                self.json_ld.append(json_module.loads("".join(self._script_buffer)))
            except (ValueError, TypeError):
                pass
            self._active_script = None
            self._script_buffer = []

    def handle_data(self, data):
        text = " ".join(data.split())
        if self._active_script == "json-ld":
            self._script_buffer.append(data)
            return
        if text:
            self.body_text.append(text)
        if self._active_tag == "title":
            self.title += text
        elif self._active_heading and text:
            self.headings[self._active_heading].append(text)


def _validate_public_url(target_url):
    parsed = urlparse(target_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Only public http:// or https:// URLs can be audited.")
    try:
        addresses = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise ValueError("The URL host could not be resolved.") from exc
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("Private and local network URLs cannot be audited.")


def _audit_page(target_url):
    current_url = target_url
    response = None
    for _ in range(4):
        _validate_public_url(current_url)
        response = http_requests.get(
            current_url,
            headers={"User-Agent": "SEOplusPageAudit/1.0"},
            timeout=15,
            allow_redirects=False,
        )
        if response.status_code not in {301, 302, 303, 307, 308}:
            break
        location = response.headers.get("Location")
        if not location:
            break
        current_url = urljoin(current_url, location)
    if response is None:
        raise ValueError("The page could not be fetched.")
    if response.status_code >= 400:
        raise ValueError(f"The page returned HTTP {response.status_code}.")
    if len(response.content) > 3 * 1024 * 1024:
        raise ValueError("The page is larger than the 3 MB audit limit.")

    parser = PageAuditParser()
    parser.feed(response.text)
    title = parser.title.strip()
    description = parser.description.strip()
    word_count = len(" ".join(parser.body_text).split())
    internal_links = [link for link in parser.links if urlparse(urljoin(current_url, link)).netloc == urlparse(current_url).netloc]
    missing_alt = sum(1 for image in parser.images if not image["alt"].strip())
    issues = []
    if not title:
        issues.append({"severity": "critical", "title": "Missing title", "detail": "Add a unique, descriptive title tag."})
    elif len(title) < 30 or len(title) > 60:
        issues.append({"severity": "warning", "title": "Title length", "detail": f"The title is {len(title)} characters; aim for roughly 30-60."})
    if not description:
        issues.append({"severity": "critical", "title": "Missing meta description", "detail": "Add a concise description that explains the page value."})
    elif len(description) < 70 or len(description) > 160:
        issues.append({"severity": "warning", "title": "Meta description length", "detail": f"The description is {len(description)} characters; aim for roughly 70-160."})
    if len(parser.headings["h1"]) != 1:
        issues.append({"severity": "warning", "title": "H1 structure", "detail": f"Found {len(parser.headings['h1'])} H1 headings; use one clear primary heading."})
    if missing_alt:
        issues.append({"severity": "warning", "title": "Images missing alt text", "detail": f"{missing_alt} image(s) do not include descriptive alt text."})
    if not parser.canonical:
        issues.append({"severity": "info", "title": "Missing canonical", "detail": "Add a canonical link when duplicate URL variants are possible."})
    if len(internal_links) < 3:
        issues.append({"severity": "info", "title": "Internal linking", "detail": "Add more relevant internal links to strengthen discovery and topical context."})

    critical = sum(1 for issue in issues if issue["severity"] == "critical")
    warning = sum(1 for issue in issues if issue["severity"] == "warning")
    score = max(0, 100 - (critical * 20) - (warning * 8) - sum(1 for issue in issues if issue["severity"] == "info") * 3)
    return {
        "url": current_url,
        "statusCode": response.status_code,
        "score": score,
        "summary": {"critical": critical, "warnings": warning, "info": len(issues) - critical - warning},
        "metadata": {"title": title, "titleLength": len(title), "description": description, "descriptionLength": len(description), "canonical": parser.canonical, "robots": parser.robots, "ogTitle": parser.og_title, "ogDescription": parser.og_description},
        "structure": {"h1": parser.headings["h1"], "h2": parser.headings["h2"], "h3": parser.headings["h3"], "wordCount": word_count},
        "links": {"total": len(parser.links), "internal": len(internal_links), "external": len(parser.links) - len(internal_links)},
        "images": {"total": len(parser.images), "missingAlt": missing_alt},
        "structuredData": {"items": len(parser.json_ld), "types": [item.get("@type") for item in parser.json_ld if isinstance(item, dict) and item.get("@type")]},
        "issues": issues,
    }


def _get_ai_client():
    api_key = os.environ.get("AI_API_KEY", "")
    if not api_key:
        return None, None
    base_url = os.environ.get("AI_BASE_URL") or "https://api.groq.com/openai/v1"
    model = os.environ.get("AI_MODEL", "openai/gpt-oss-120b")
    client = OpenAI(api_key=api_key, base_url=base_url)
    return client, model


@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({"status": "running", "gsc_connected": False, "sites_count": 0})


@app.route("/api/page-audit", methods=["POST"])
def page_audit():
    data = request.get_json(silent=True) or {}
    target_url = (data.get("url") or "").strip()
    if not target_url:
        return jsonify({"error": "url is required"}), 400
    try:
        return jsonify(_audit_page(target_url))
    except (ValueError, http_requests.RequestException) as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/page-audit-insights", methods=["POST"])
def page_audit_insights():
    client, model = _get_ai_client()
    if not client:
        return jsonify({"error": "AI provider not configured. Set AI_API_KEY in Vercel project settings."}), 400

    data = request.get_json(silent=True) or {}
    audit = data.get("audit") or {}
    if not audit:
        return jsonify({"error": "audit is required"}), 400

    metadata = audit.get("metadata", {})
    structure = audit.get("structure", {})
    links = audit.get("links", {})
    images = audit.get("images", {})
    structured_data = audit.get("structuredData", {})
    issues = audit.get("issues", [])

    content = f"URL: {audit.get('url', 'N/A')}\n"
    content += f"SEO score: {audit.get('score', 'N/A')}/100\n\n"
    content += f"Title ({metadata.get('titleLength', 0)} chars): {metadata.get('title') or 'Missing'}\n"
    content += f"Meta description ({metadata.get('descriptionLength', 0)} chars): {metadata.get('description') or 'Missing'}\n"
    content += f"Canonical: {metadata.get('canonical') or 'Not found'}\n"
    content += f"Robots: {metadata.get('robots') or 'Not specified'}\n\n"
    content += f"H1 count: {len(structure.get('h1', []))} ({', '.join(structure.get('h1', [])) or 'none'})\n"
    content += f"H2 count: {len(structure.get('h2', []))}\n"
    content += f"Word count: {structure.get('wordCount', 0)}\n\n"
    content += f"Links: {links.get('total', 0)} total, {links.get('internal', 0)} internal, {links.get('external', 0)} external\n"
    content += f"Images: {images.get('total', 0)} total, {images.get('missingAlt', 0)} missing alt text\n"
    content += f"Structured data types: {', '.join(structured_data.get('types', [])) or 'none'}\n\n"
    content += "Detected issues:\n"
    for issue in issues:
        content += f"- [{issue.get('severity', 'info')}] {issue.get('title', '')}: {issue.get('detail', '')}\n"
    if not issues:
        content += "- none\n"

    system_prompt = (
        "You are an SEO consultant reviewing a single page's technical audit for a non-technical marketer. "
        "Write a short, plain-English summary in three parts using markdown headings:\n\n"
        "**What's working** - 1-2 sentences on the page's genuine strengths.\n"
        "**Fix first** - the top 2-3 issues to prioritize, ranked by likely impact, each with a one-line reason why it matters for search visibility or click-through.\n"
        "**Quick win** - one specific, concrete action they could do today.\n\n"
        "Be concise and specific to the data given. No generic SEO advice, no fluff, no repeating the raw numbers back verbatim."
    )

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
        )
        return jsonify({"insights": completion.choices[0].message.content or ""})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
