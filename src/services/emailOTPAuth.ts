// ...existing imports
import emailjs from 'emailjs-com';

// ...existing code

// Around line 89-90, update the template params to match your EmailJS template
const templateParams = {
  to_email: email, // or 'email' depending on your template
  to_name: email.split('@')[0], // recipient name
  passcode: otp, // or 'otp', 'code', 'message' - check your template
  from_name: 'BookOnce', // your app name
};

console.log('📧 Sending OTP to:', email);
console.log('📧 Template params:', templateParams);

emailjs
  .send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    templateParams,
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  )
  .then(response => {
    console.log('SUCCESS!', response.status, response.text);
  })
  .catch(err => {
    console.error('FAILED...', err);
  });
