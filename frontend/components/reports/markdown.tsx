/** Minimal, safe Markdown renderer for generated reports (headings, lists, bold, em). */
export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (/^#{1}\s/.test(line)) {
      flush();
      blocks.push(<h1 key={blocks.length}>{inline(line.replace(/^#\s/, ""))}</h1>);
    } else if (/^#{2}\s/.test(line)) {
      flush();
      blocks.push(<h2 key={blocks.length}>{inline(line.replace(/^##\s/, ""))}</h2>);
    } else if (/^#{3}\s/.test(line)) {
      flush();
      blocks.push(<h3 key={blocks.length}>{inline(line.replace(/^###\s/, ""))}</h3>);
    } else if (/^[-*]\s/.test(line)) {
      list.push(line.replace(/^[-*]\s/, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      blocks.push(<p key={blocks.length}>{inline(line)}</p>);
    }
  });
  flush();

  return <div className="report-prose">{blocks}</div>;
}

function inline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((seg, i) => {
    const b = seg.match(/^\*\*([^*]+)\*\*$/);
    if (b) return <strong key={i}>{b[1]}</strong>;
    const em = seg.match(/^\*([^*]+)\*$/);
    if (em) return <em key={i}>{em[1]}</em>;
    return <span key={i}>{seg}</span>;
  });
}
