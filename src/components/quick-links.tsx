"use client";

import { GitPullRequest, Layers } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

function GitlabMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m23.55 9.8-.03-.08-3.26-8.5a.85.85 0 0 0-.84-.54.85.85 0 0 0-.8.62L16.4 7.5H7.6L5.38 1.3a.85.85 0 0 0-.8-.62.85.85 0 0 0-.83.54L.48 9.72l-.03.08a6.03 6.03 0 0 0 2 6.97l.01.01.03.02 4.95 3.71 2.45 1.86 1.5 1.13a1 1 0 0 0 1.2 0l1.5-1.13 2.45-1.86 4.98-3.73.01-.01a6.03 6.03 0 0 0 2-6.97Z" />
    </svg>
  );
}

type QuickLink = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const LINKS: QuickLink[] = [
  { label: "GitHub", href: "https://github.com/risixdzn", icon: GithubMark },
  { label: "GitLab", href: "https://gitlab.ethercity.app", icon: GitlabMark },
  {
    label: "Pull Requests",
    href: "https://github.com/pulls",
    icon: GitPullRequest,
  },
  { label: "Linear", href: "https://linear.app", icon: Layers },
];

export function QuickLinks() {
  return (
    <nav
      aria-label="Quick links"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          className="group flex items-center gap-1.5 rounded-md bg-border/50 px-2.5 py-1 text-sm text-foreground/90 transition-[background-color,transform] hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          {label}
        </a>
      ))}
    </nav>
  );
}
