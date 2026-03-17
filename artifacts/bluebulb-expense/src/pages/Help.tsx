import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, LifeBuoy, FileQuestion } from "lucide-react";

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <LifeBuoy className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">How can we help?</h1>
        <p className="text-lg text-muted-foreground mt-2">Find answers to common questions about the Bluebulb Expense System.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start space-x-4">
            <BookOpen className="h-8 w-8 text-primary mt-1" />
            <div>
              <CardTitle>User Guide</CardTitle>
              <CardDescription className="mt-1">Complete documentation on how to raise and track expenses.</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start space-x-4">
            <FileQuestion className="h-8 w-8 text-primary mt-1" />
            <div>
              <CardTitle>Approval Policies</CardTitle>
              <CardDescription className="mt-1">Learn about company limits and routing rules.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
          <CardTitle className="text-2xl font-display">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-4 bg-white data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="hover:no-underline font-semibold text-base py-4">How do I raise a new expense?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                Navigate to "My Expense Requests" from the sidebar and click the "Raise Expense" button in the top right corner. Fill out the form completely, including your bank details and the necessary approvers, then click "Raise Expense Now".
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border rounded-lg px-4 bg-white data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="hover:no-underline font-semibold text-base py-4">What happens after I submit an expense?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                Your request goes through a multi-step workflow: First to your Manager, then Internal Control, then the Finance Manager. Once fully approved, it moves to the Finance Team for payment. You can track the exact status in the "My Expense Requests" table.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-4 bg-white data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="hover:no-underline font-semibold text-base py-4">What does it mean to "Retire" an expense?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                Retirement is required when you are given an advance sum of money. After the activity, you must "retire" the expense by stating exactly how much was spent, providing receipts, and returning any unused balance to the company.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-4 bg-white data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="hover:no-underline font-semibold text-base py-4">My expense was rejected. What should I do?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                Click "View" on the rejected expense to see the rejection reason provided by the approver. You will need to create a new expense request correcting the issues mentioned in the reason.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
