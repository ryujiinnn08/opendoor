import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

/**
 * Layout for text pages such as the privacy notice and accessibility statement.
 * sections: [{ heading, paragraphs?: string[], items?: string[] }]
 */
export default function InfoPage({ title, intro, sections, draft = false }) {
  return (
    <article className="max-w-prose">
      <PageHeading>{title}</PageHeading>
      {draft && (
        <Notice tone="info" className="mt-6">
          Draft for review by the OpenDoor project team.
        </Notice>
      )}
      <p className="mt-6 text-lg">{intro}</p>
      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-2xl font-bold">{section.heading}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-3">
              {text}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-1 pl-6">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  )
}
