export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  // Format as Vietnamese phone number: 0XXX XXX XXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function buildFilterQuery(search?: string, status?: string, trash?: boolean): Record<string, any> {
  const query: Record<string, any> = {};
  if (search) {
    query.search = search;
  }
  if (status) {
    query.status = status;
  }
  if (trash !== undefined) {
    query.trash = trash;
  }
  return query;
}
