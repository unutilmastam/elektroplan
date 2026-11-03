import { PlaceholderPage } from '@/components/layout/PlaceholderPage';
import { uz } from '@/i18n/uz';

export default function NotFound() {
  return <PlaceholderPage title={uz.pages.notFoundTitle} text={uz.pages.notFoundText} later={false} />;
}
