/**
 * Global active student ID for namespacing localStorage keys.
 * Set when a student logs in, cleared on logout.
 * All storage modules use this to scope data per student.
 */

let _activeId: string | null = null;

export function setActiveStudentId(id: string | null) {
  _activeId = id;
}

export function getActiveStudentId(): string | null {
  return _activeId;
}

/**
 * Build a student-scoped storage key.
 * Guest mode (no active student) uses the base key for backward compatibility.
 */
export function scopedKey(baseKey: string): string {
  if (_activeId) return `${baseKey}:${_activeId}`;
  return baseKey;
}
