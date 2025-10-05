// controllers/contactController.js
const transporter = require("../services/emailService");

const sendMessage = async (req, res) => {
  const { name, email, category, message } = req.body;

  // Validation
  if (!name || !email || !category || !message) {
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }

  // Email template based on your image
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .footer { margin-top: 20px; padding: 20px; background: #eee; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Contact Form Submission</h1>
          <p>Skills Swap Website</p>
        </div>
        
        <div class="content">
          <h2>Contact Information</h2>
          
          <div class="field">
            <span class="label">Full Name:</span>
            <span>${name}</span>
          </div>
          
          <div class="field">
            <span class="label">Email Address:</span>
            <span>${email}</span>
          </div>
          
          <div class="field">
            <span class="label">Category:</span>
            <span>${category}</span>
          </div>
          
          <div class="field">
            <span class="label">Message:</span>
            <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>This message was sent from your Skills Swap contact form</p>
          <p>📧 contact@skillsswap.com | 📞 +1 (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: {
      name: "Skills Swap Website",
      address: process.env.EMAIL_USER
    },
    to: process.env.EMAIL_USER, // আপনার email-এ পাঠাবে
    replyTo: email, // User-কে reply দিতে পারবেন
    subject: `New ${category} Inquiry from ${name} - Skills Swap`,
    html: emailTemplate,
    text: `
      New Contact Form Submission - Skills Swap
      
      Name: ${name}
      Email: ${email}
      Category: ${category}
      Message: ${message}
      
      This message was sent from your Skills Swap contact form.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent from: ${email}`);
    
    res.status(200).json({ 
      success: true, 
      message: "Your message has been sent successfully! We'll get back to you within 24 hours." 
    });
  } catch (error) {
    console.error("❌ Email error:", error);
    
    res.status(500).json({ 
      success: false, 
      error: "Failed to send message. Please try again later." 
    });
  }
};

module.exports = { sendMessage };