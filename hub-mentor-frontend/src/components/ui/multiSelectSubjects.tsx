import { Label } from "./label"
import { Checkbox } from "./checkbox"
import { RadioGroup, RadioGroupItem } from "./radio-group"

export function SelectSubjects({
  subjectsFromBackend = [],
  formData,
  setFormData,
  selectionMode = "multi", // "multi" or "single"
}) {
  const toggleSubject = (subjectName) => {
    setFormData((prev) => {
      if (selectionMode === "single") {
        return { ...prev, subjects: [subjectName] }
      }

      // multi
      const selected = prev.subjects || []
      const isSelected = selected.includes(subjectName)
      return {
        ...prev,
        subjects: isSelected
          ? selected.filter((s) => s !== subjectName)
          : [...selected, subjectName],
      }
    })
  }

  return (
    <div className="space-y-2">
      <Label>Select Subjects</Label>

      {selectionMode === "single" ? (
        <RadioGroup
          value={formData.subjects?.[0] || ""}
          onValueChange={(value) => toggleSubject(value)}
        >
          {subjectsFromBackend.map((subject) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <RadioGroupItem value={subject.name} id={`subject-${subject.id}`} />
              <Label htmlFor={`subject-${subject.id}`}>{subject.name}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {subjectsFromBackend.map((subject) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject.id}`}
                checked={formData.subjects?.includes(subject.name)}
                onCheckedChange={() => toggleSubject(subject.name)}
              />
              <Label htmlFor={`subject-${subject.id}`}>{subject.name}</Label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
