import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const messageData = await request.json()
    
    const ghlApiKey = process.env.GHL_API_KEY
    const emailFrom = process.env.GHL_EMAIL_FROM || 'noreply@australianinvestmentproperty.com.au'
    
    if (!ghlApiKey) {
      console.error('❌ GHL API key not found in environment')
      return NextResponse.json(
        { error: 'GHL API key not configured' },
        { status: 500 }
      )
    }

    console.log('📧 Sending GHL message:', {
      type: messageData.type,
      contactId: messageData.contactId,
      subject: messageData.subject
    })

    const ghlMessagePayload = {
      type: messageData.type,
      contactId: messageData.contactId,
      subject: messageData.subject,
      html: messageData.html,
      message: messageData.message,
      status: messageData.status,
      emailFrom: emailFrom,
      ...(messageData.emailTo && { emailTo: messageData.emailTo })
    }

    const response = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ghlMessagePayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ GHL API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      })
      return NextResponse.json(
        { error: 'Failed to send message via GHL', details: responseData },
        { status: response.status }
      )
    }

    console.log('✅ GHL message sent successfully:', responseData)

    return NextResponse.json({
      success: true,
      messageId: responseData.messageId,
      conversationId: responseData.conversationId,
      emailMessageId: responseData.emailMessageId
    })

  } catch (error) {
    console.error('❌ Error sending GHL message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}