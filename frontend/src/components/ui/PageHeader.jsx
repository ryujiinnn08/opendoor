import PageHeading from './PageHeading.jsx'

/**
 * The top of a page: its heading, a short intro, and the page's main action. On phones the
 * action sits under the intro; on wider screens it moves to the right.
 */
export default function PageHeader({ title, documentTitle, intro, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-prose">
        <PageHeading title={documentTitle}>{title}</PageHeading>
        {intro && <p className="mt-4">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
