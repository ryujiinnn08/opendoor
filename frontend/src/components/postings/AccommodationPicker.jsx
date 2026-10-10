import FormField, { FieldError } from '../ui/FormField.jsx'
import { describedBy } from '../ui/fieldStyles.js'
import AccommodationGroupIcon from './AccommodationGroupIcon.jsx'

/**
 * Grouped checklist of accommodation types (plan PHASE_2 §4.7). Ticking one reveals a labelled
 * note field. Phase 3 reuses it for candidate needs and filters with withNotes={false}.
 *
 * groups: [{ group, accommodations: [{ id, name, description, is_active }] }]
 * value:  [{ id, note }], kept in the order the picker shows them
 * noteErrors: { [id]: message }
 */
export default function AccommodationPicker({
  id,
  legend,
  hint,
  groups,
  value,
  onChange,
  error,
  noteErrors = {},
  withNotes = true,
}) {
  const chosen = new Map(value.map((item) => [item.id, item]))
  const displayOrder = groups.flatMap((group) => group.accommodations.map((item) => item.id))
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null

  function emit(next) {
    onChange(displayOrder.filter((itemId) => next.has(itemId)).map((itemId) => next.get(itemId)))
  }

  function toggle(itemId, checked) {
    const next = new Map(chosen)
    if (checked) next.set(itemId, { id: itemId, note: '' })
    else next.delete(itemId)
    emit(next)
  }

  function changeNote(itemId, note) {
    emit(new Map(chosen).set(itemId, { id: itemId, note }))
  }

  return (
    // tabIndex lets an error summary link move focus to the whole list.
    <fieldset id={id} tabIndex={-1} aria-describedby={describedBy(hintId, errorId)} className="mb-6">
      <legend className="text-xl font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 max-w-prose text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <fieldset key={group.group}>
            <legend className="flex items-center gap-2 text-lg font-bold">
              <AccommodationGroupIcon group={group.group} />
              {group.group}
            </legend>
            <ul className="mt-2 space-y-3">
              {group.accommodations.map((item) => {
                const checkboxId = `accommodation-${item.id}`
                const descriptionId = item.description ? `${checkboxId}-hint` : null
                const selected = chosen.get(item.id)

                return (
                  <li key={item.id}>
                    <div className="flex items-start gap-3">
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={(event) => toggle(item.id, event.target.checked)}
                        aria-describedby={descriptionId ?? undefined}
                        className="mt-1 size-6 shrink-0 accent-primary"
                      />
                      <div>
                        {/* The ::before stretches the click area over the checkbox and to 44 px tall, without moving anything. */}
                        <label
                          htmlFor={checkboxId}
                          className="relative block font-bold before:absolute before:-inset-y-3 before:right-0 before:-left-9 before:content-['']"
                        >
                          {item.is_active === false ? `${item.name} (no longer offered)` : item.name}
                        </label>
                        {item.description && (
                          <p id={descriptionId} className="text-muted">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {withNotes && selected && (
                      <div className="mt-3 ml-9 animate-reveal">
                        <FormField
                          id={`${checkboxId}-note`}
                          label={`Note about ${item.name}`}
                          optional
                          hint="For example, where it is or how to ask for it."
                          value={selected.note ?? ''}
                          onChange={(event) => changeNote(item.id, event.target.value)}
                          error={noteErrors[item.id]}
                          maxLength={255}
                          className="mb-0"
                          inputClassName="max-w-xl"
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </fieldset>
        ))}
      </div>
    </fieldset>
  )
}
