"""
EventFlow Email Service
Handles all email sending functionality
"""

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict, Any, Union
import os
import asyncio

from ..core.config import get_settings
from ..core.database import db, Collections

settings = get_settings()


class EmailService:
    """Email service for sending various types of emails"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from = settings.SMTP_FROM
        self.smtp_from_name = settings.SMTP_FROM_NAME
        self.smtp_tls = settings.SMTP_TLS
        self.smtp_ssl = settings.SMTP_SSL
        self.debug = settings.DEBUG
    
    async def send_email(
        self,
        to: Union[str, List[str]],
        subject: str,
        html_content: Optional[str] = None,
        text_content: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """Send an email with optional HTML content, text content, and attachments"""
        
        if not self.smtp_user or not self.smtp_password:
            if self.debug:
                print(f"⚠️  SMTP not configured. Email would be sent to: {to}")
                print(f"Subject: {subject}")
                if html_content:
                    print(f"HTML Content: {html_content[:200]}...")
                if text_content:
                    print(f"Text Content: {text_content[:200]}...")
            return True
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg["From"] = f"{self.smtp_from_name} <{self.smtp_from}>"
            msg["Subject"] = subject
            
            if reply_to:
                msg["Reply-To"] = reply_to
            if cc:
                msg["Cc"] = ", ".join(cc)
            if bcc:
                msg["Bcc"] = ", ".join(bcc)
            
            # Add text content
            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            
            # Add HTML content
            if html_content:
                msg.attach(MIMEText(html_content, "html"))
            
            # Add attachments
            if attachments:
                for attachment in attachments:
                    filename = attachment.get("filename")
                    content = attachment.get("content")
                    content_type = attachment.get("content_type", "application/octet-stream")
                    
                    if filename and content:
                        part = MIMEApplication(content, Name=filename)
                        part["Content-Disposition"] = f'attachment; filename="{filename}"'
                        part["Content-Type"] = content_type
                        msg.attach(part)
            
            # Convert to bytes
            email_bytes = msg.as_bytes()
            
            # Send email
            if self.smtp_ssl:
                smtp = aiosmtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            else:
                smtp = aiosmtplib.SMTP(self.smtp_host, self.smtp_port)
            
            try:
                if self.smtp_tls and not self.smtp_ssl:
                    await smtp.starttls()
                
                await smtp.login(self.smtp_user, self.smtp_password)
                
                recipients = to if isinstance(to, list) else [to]
                await smtp.sendmail(
                    self.smtp_from,
                    recipients + (cc or []) + (bcc or []),
                    email_bytes
                )
                
                print(f"✅ Email sent to: {recipients}")
                return True
            
            finally:
                await smtp.quit()
        
        except Exception as e:
            print(f"❌ Error sending email: {e}")
            if self.debug:
                print(f"Email details:")
                print(f"  To: {to}")
                print(f"  Subject: {subject}")
                print(f"  Content: {html_content or text_content}")
            return False
    
    async def send_otp_email(
        self,
        to: str,
        otp: str,
        name: Optional[str] = None
    ) -> bool:
        """Send OTP verification email"""
        
        subject = f"Your EventFlow Verification Code: {otp}"
        
        name = name or "User"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .otp {{ font-size: 24px; font-weight: bold; color: #FF7A33; text-align: center; margin: 20px 0; letter-spacing: 5px; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>Email Verification</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>Thank you for registering with EventFlow. To complete your registration, please use the following verification code:</p>
                    <div class="otp">{otp}</div>
                    <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)
    
    async def send_password_reset_email(
        self,
        to: str,
        reset_link: str,
        name: Optional[str] = None
    ) -> bool:
        """Send password reset email"""
        
        subject = "Reset Your EventFlow Password"
        
        name = name or "User"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>Password Reset</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>We received a request to reset your EventFlow password. Click the button below to reset it:</p>
                    <p style="text-align: center;"><a href="{reset_link}" class="button">Reset Password</a></p>
                    <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)
    
    async def send_welcome_email(
        self,
        to: str,
        name: str,
        role: str
    ) -> bool:
        """Send welcome email to new user"""
        
        subject = f"Welcome to EventFlow, {name}!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
                .role-badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; }}
                .admin {{ background: #EF4444; color: white; }}
                .organizer {{ background: #FF7A33; color: white; }}
                .volunteer {{ background: #10B981; color: white; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>Welcome to the Team!</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>Welcome to EventFlow! We're excited to have you on board as a <span class="role-badge {role.lower()}">{role}</span>.</p>
                    <p>EventFlow is your complete event volunteer management platform. Here's what you can do:</p>
                    <ul>
                        <li>Discover and apply to events that match your skills</li>
                        <li>Track your volunteer hours and achievements</li>
                        <li>Receive realtime notifications and updates</li>
                        <li>Connect with event organizers and other volunteers</li>
                    </ul>
                    <p style="text-align: center;"><a href="{settings.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a></p>
                    <p>If you have any questions, don't hesitate to reach out to our support team.</p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)
    
    async def send_event_assigned_email(
        self,
        to: str,
        name: str,
        event_title: str,
        event_date: str,
        event_venue: str,
        role: str,
        organizer_name: str
    ) -> bool:
        """Send email when volunteer is assigned to an event"""
        
        subject = f"You've been assigned to: {event_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
                .event-card {{ background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF7A33; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>New Event Assignment</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>Great news! You have been assigned to the following event:</p>
                    <div class="event-card">
                        <h3 style="margin: 0 0 10px 0; color: #FF7A33;">{event_title}</h3>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {event_date}</p>
                        <p style="margin: 5px 0;"><strong>Venue:</strong> {event_venue}</p>
                        <p style="margin: 5px 0;"><strong>Your Role:</strong> {role}</p>
                        <p style="margin: 5px 0;"><strong>Organizer:</strong> {organizer_name}</p>
                    </div>
                    <p>Please review the event details in your dashboard and confirm your participation.</p>
                    <p style="text-align: center;"><a href="{settings.FRONTEND_URL}/dashboard/volunteer/events" class="button">View My Events</a></p>
                    <p>If you have any questions about this assignment, please contact the event organizer.</p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)
    
    async def send_task_assigned_email(
        self,
        to: str,
        name: str,
        task_title: str,
        event_title: str,
        due_date: str,
        priority: str,
        organizer_name: str
    ) -> bool:
        """Send email when a task is assigned to a volunteer"""
        
        subject = f"New Task: {task_title}"
        
        priority_colors = {
            "LOW": "#6B7280",
            "MEDIUM": "#F59E0B",
            "HIGH": "#EF4444",
            "URGENT": "#991B1B"
        }
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
                .task-card {{ background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid {priority_colors.get(priority, '#6B7280')}; }}
                .priority-badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: {priority_colors.get(priority, '#6B7280')}; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>New Task Assigned</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>You have been assigned a new task for the event <strong>{event_title}</strong>:</p>
                    <div class="task-card">
                        <h3 style="margin: 0 0 10px 0; color: #2D2D2D;">{task_title}</h3>
                        <p style="margin: 5px 0;"><span class="priority-badge">{priority}</span></p>
                        <p style="margin: 5px 0;"><strong>Due Date:</strong> {due_date}</p>
                        <p style="margin: 5px 0;"><strong>Assigned by:</strong> {organizer_name}</p>
                    </div>
                    <p>Please complete this task by the due date. You can start and mark tasks as completed in your dashboard.</p>
                    <p style="text-align: center;"><a href="{settings.FRONTEND_URL}/dashboard/volunteer/tasks" class="button">View My Tasks</a></p>
                    <p>If you have any questions about this task, please contact the event organizer.</p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)
    
    async def send_announcement_email(
        self,
        to: str,
        name: str,
        announcement_title: str,
        announcement_message: str,
        event_title: str,
        organizer_name: str
    ) -> bool:
        """Send email when an announcement is published"""
        
        subject = f"New Announcement: {announcement_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Manrope', Arial, sans-serif; line-height: 1.6; color: #2D2D2D; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #FF7A33 0%, #B064FF 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ padding: 20px; background: #FFFFFF; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; }}
                .button {{ background: #FF7A33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .footer {{ margin-top: 20px; padding: 20px; text-align: center; color: #6B6B6B; font-size: 12px; }}
                .announcement-card {{ background: #F9FAFB; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #B064FF; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>EventFlow</h1>
                    <p>New Announcement</p>
                </div>
                <div class="content">
                    <p>Hello {name},</p>
                    <p>There's a new announcement for the event <strong>{event_title}</strong>:</p>
                    <div class="announcement-card">
                        <h3 style="margin: 0 0 10px 0; color: #B064FF;">{announcement_title}</h3>
                        <p style="margin: 5px 0; white-space: pre-line;">{announcement_message}</p>
                        <p style="margin: 10px 0 5px 0; color: #6B6B6B; font-size: 14px;">Posted by: {organizer_name}</p>
                    </div>
                    <p>You can view all announcements in your dashboard.</p>
                    <p style="text-align: center;"><a href="{settings.FRONTEND_URL}/dashboard/volunteer/announcements" class="button">View Announcements</a></p>
                    <p>Best regards,<br>The EventFlow Team</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} EventFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, subject, html_content)


# Create email service instance
email_service = EmailService()

# Export
__all__ = ['EmailService', 'email_service']
