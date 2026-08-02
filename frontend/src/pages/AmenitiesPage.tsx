import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export default function AmenitiesPage() {
  return (
    <div>
      <PageHeader
        title="Amenities"
        description="Manage hotel amenities and features"
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted">Amenities management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
