import React from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ChatbotFeedbackDashboard } from '@/components/admin/ChatbotFeedbackDashboard'

const AdminChatbotFeedback: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chatbot Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            View and analyze user feedback from chatbot interactions
          </p>
        </div>
        <ChatbotFeedbackDashboard />
      </div>
    </DashboardLayout>
  )
}

export default AdminChatbotFeedback
