import { useState, useCallback } from 'react'

// Generic form hook — manages values, per-field errors, and touched state.
// validationRules: { fieldName: (value) => string|null }
export function useForm(initialValues, validationRules = {}) {
  const [values,  setValues]  = useState(initialValues)
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Validate on change only if the field was already touched
    if (touched[field] && validationRules[field]) {
      const error = validationRules[field](value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [touched, validationRules])

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (validationRules[field]) {
      const error = validationRules[field](values[field])
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }, [values, validationRules])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true
    for (const [field, validator] of Object.entries(validationRules)) {
      const error = validator(values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    }
    setErrors(newErrors)
    // Mark every validated field as touched so errors show
    const allTouched = Object.keys(validationRules).reduce(
      (acc, k) => ({ ...acc, [k]: true }), {}
    )
    setTouched(allTouched)
    return isValid
  }, [values, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return { values, errors, touched, setValue, handleBlur, validateAll, reset }
}
