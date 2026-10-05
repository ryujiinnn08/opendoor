import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import { removeLogo, uploadLogo } from '../../api/employer.js'
import FileUpload from '../../components/ui/FileUpload.jsx'

/**
 * Logo (or photo, for individual employers) upload for the employer profile.
 */
export default function LogoSection({ employer, label, onChange }) {
  async function run(action) {
    try {
      onChange(await action())
    } catch (error) {
      throw new Error(fieldErrorsFrom(error).logo ?? generalErrorFrom(error))
    }
  }

  return (
    <FileUpload
      id="logo"
      label={label}
      currentUrl={employer.logo_url}
      previewAlt={`Current image for ${employer.name}`}
      onUpload={(file) => run(() => uploadLogo(file))}
      onRemove={() => run(removeLogo)}
    />
  )
}
