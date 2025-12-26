import { Card } from '@/components/ui/card'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react'
import { Header } from '@/components/landing/Header'
import { Footer } from '@/components/landing/Footer'

export default function ReviewGuidelines() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Review Guidelines
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us maintain a helpful and respectful community by following
            these guidelines when writing reviews.
          </p>
        </div>
        {/* Table of Contents */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a
              href="#introduction"
              className="block text-primary hover:underline"
            >
              Introduction
            </a>
            <a
              href="#good-reviews"
              className="block text-primary hover:underline"
            >
              What Makes a Good Review
            </a>
            <a
              href="#what-to-avoid"
              className="block text-primary hover:underline"
            >
              What to Avoid
            </a>
            {/* <a href="#reporting" className="block text-primary hover:underline">
              Reporting Inappropriate Reviews
            </a> */}
            <a href="#contact" className="block text-primary hover:underline">
              Contact Us
            </a>
          </nav>
        </Card>
        {/* Introduction */}
        <Card className="p-6 mb-6" id="introduction">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Reviews are an essential part of our community, helping other
            travelers make informed decisions about their bus journeys. We
            appreciate all feedback, whether positive or constructive, as it
            helps us improve our service.
          </p>
          <p className="text-muted-foreground">
            These guidelines ensure that reviews remain helpful, respectful, and
            focused on the travel experience. All reviews are subject to our
            Terms of Service and may be moderated or removed if they violate
            these guidelines.
          </p>
        </Card>
        {/* What Makes a Good Review */}
        <Card className="p-6 mb-6" id="good-reviews">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold">What Makes a Good Review</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Be Specific and Honest</h3>
              <p className="text-muted-foreground">
                Share specific details about your experience. Mention the bus
                condition, driver's behavior, punctuality, cleanliness, and
                value for money. Honest feedback helps other travelers
                understand what to expect.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Focus on Facts</h3>
              <p className="text-muted-foreground">
                Describe what actually happened during your trip rather than
                making general statements. For example, "The bus was 30 minutes
                late" is more helpful than "The service is terrible."
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                Balance Positive and Negative
              </h3>
              <p className="text-muted-foreground">
                If you had both good and bad experiences, mention both. This
                gives a complete picture and helps other travelers weigh the
                overall experience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Keep it Relevant</h3>
              <p className="text-muted-foreground">
                Focus on aspects that other travelers can learn from, such as
                comfort, safety, customer service, and overall journey quality.
              </p>
            </div>
          </div>
        </Card>
        {/* What to Avoid */}
        <Card className="p-6 mb-6" id="what-to-avoid">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-semibold">What to Avoid</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                Personal Attacks or Harassment
              </h3>
              <p className="text-muted-foreground">
                Do not attack, threaten, or harass other users, drivers, or
                staff. This includes posting personally identifying information
                about others.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Inappropriate Content</h3>
              <p className="text-muted-foreground">
                Avoid profanity, discriminatory language, hate speech, or
                content that promotes violence, illegal activities, or harmful
                behavior.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Spam or Advertising</h3>
              <p className="text-muted-foreground">
                Do not post promotional content, spam, or irrelevant links.
                Reviews should be about the travel experience, not marketing
                other services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">False Information</h3>
              <p className="text-muted-foreground">
                Do not spread misinformation, exaggerate experiences, or make
                false claims. Reviews should reflect genuine experiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Off-Topic Content</h3>
              <p className="text-muted-foreground">
                Keep reviews focused on the bus service and travel experience.
                Avoid discussing unrelated political, religious, or
                controversial topics.
              </p>
            </div>
          </div>
        </Card>
        {/* Reporting Inappropriate Reviews */}{' '}
        {/* <Card className="p-6 mb-6" id="reporting">
          {' '}
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />{' '}
            <h2 className="text-2xl font-semibold">
              Reporting Inappropriate Reviews{' '}
            </h2>{' '}
          </div>{' '}
          <p className="text-muted-foreground mb-4">
            {' '}
            If you encounter a review that violates these guidelines or makes
            you uncomfortable, please report it immediately. We take all reports
            seriously and review them promptly.{' '}
          </p>{' '}
          <div className="bg-muted p-4 rounded-lg">
            {' '}
            <h3 className="font-semibold mb-2">How to Report</h3>{' '}
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              {' '}
              <li>Click the "Report" button below the review</li>{' '}
              <li>Select the reason for reporting</li>{' '}
              <li>Provide additional details if necessary</li>{' '}
              <li>Submit the report</li>{' '}
            </ol>{' '}
          </div>{' '}
          <p className="text-muted-foreground mt-4">
            {' '}
            Our moderation team will review the report and take appropriate
            action, which may include removing the review, warning the user, or
            suspending their account in severe cases.{' '}
          </p>{' '}
        </Card> */}
        {/* Contact Us */}
        <Card className="p-6 mb-6" id="contact">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have questions about these guidelines or need to report an
            issue that can't be handled through the standard reporting system,
            please contact our support team.
          </p>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <strong>Email:</strong> support@busticketbooking.com
            </p>
            <p className="text-muted-foreground">
              <strong>Phone:</strong> 1-800-BUS-HELP
            </p>
            <p className="text-muted-foreground">
              <strong>Response Time:</strong> We aim to respond to all inquiries
              within 24 hours.
            </p>
          </div>
        </Card>
        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            These guidelines may be updated at any time. We encourage you to
            check back periodically for any changes.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
