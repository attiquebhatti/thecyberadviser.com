// Course → product-line logo for the chatbot. Delegates to the shared resolver
// so CyberQuiz and the chatbot stay in sync.
import { productLogo } from '@/lib/productLogos';

export function courseLogo(courseCode: string): string {
  return productLogo(courseCode);
}
