/** Builds a wa.me link. The number comes from the admin (System Settings). */
export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
