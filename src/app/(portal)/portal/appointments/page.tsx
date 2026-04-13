import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Book and manage your lab appointments"
        actions={
          <Button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Book New
          </Button>
        }
      />

      <Card>
        <CardHeader><CardTitle>Upcoming Appointments</CardTitle></CardHeader>
        <CardBody>
          <div className="py-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-teal-soft text-teal flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <p className="text-base font-medium text-ink">No upcoming appointments</p>
            <p className="text-sm text-gray mt-1 max-w-sm mx-auto">Book your next lab visit at any of our branches. Walk-ins are also welcome.</p>
            <Button className="mt-5">Book an Appointment</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
