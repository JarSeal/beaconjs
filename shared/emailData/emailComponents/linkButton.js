const linkButton = (text, url) => {
  return `<a href="${url}" target="_blank" style="padding: 8px 32px 7px; border: 1px solid #555;border-radius: 8px;font-family: Helvetica, Arial, sans-serif;font-size: 14px; color: #ffffff;text-decoration: none;font-weight:bold;display: inline-block;background: #333;">
    ${text}
</a>`;
};

export default linkButton;
