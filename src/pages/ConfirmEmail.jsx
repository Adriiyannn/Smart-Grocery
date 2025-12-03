import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import supabase from '../utils/supabase';

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Wait a moment for Supabase to process the confirmation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the current session (should be confirmed now)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error('Unable to retrieve session');
        }

        const user = session.user;
        console.log('Authenticated user:', user.id, user.email);

        // Save user profile data to the "User" table NOW (after email is confirmed)
        const { data, error: insertError } = await supabase
          .from('User')
          .insert([
            {
              user_id: user.id,
              name: user.user_metadata?.full_name || user.email.split('@')[0],
              email: user.email
            }
          ])
          .select();

        if (insertError) {
          console.error('Error saving user profile - Full Error:', insertError);
          console.error('Error Details:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          });
          
          // Show the actual error to user so we can see what's wrong
          Swal.fire({
            icon: 'warning',
            title: 'Email Confirmed! ✓',
            html: `
              <div>
                <p style="font-size: 16px; margin-bottom: 10px;">Your email has been successfully confirmed.</p>
                <p style="font-size: 13px; color: #6b7280; margin-top: 15px;">
                  <strong>Debug Info:</strong><br/>
                  ${insertError.message}
                </p>
              </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Continue',
            position: 'top',
            timer: 3000,
            timerProgressBar: true,
            didOpen: () => {
              setTimeout(() => {
                Swal.close();
                navigate('/');
              }, 3000);
            }
          });
          return;
        }

        console.log('User profile saved successfully:', data);

        // Show success alert with auto-close timer
        setIsProcessing(false);

        await Swal.fire({
          icon: 'success',
          title: 'Email Confirmed! ✓',
          html: `
            <div>
              <p style="font-size: 16px; margin-bottom: 10px;">Your email has been successfully confirmed.</p>
              <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                Redirecting you in <strong><span id="timer">5</span></strong> seconds...
              </p>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'Go to Dashboard',
          position: 'top',
          didOpen: () => {
            let timeLeft = 5;
            const timerElement = document.getElementById('timer');
            
            const countdown = setInterval(() => {
              timeLeft--;
              if (timerElement) {
                timerElement.textContent = timeLeft;
              }
              
              if (timeLeft === 0) {
                clearInterval(countdown);
                Swal.close();
              }
            }, 1000);
          }
        });

        // Redirect to home/dashboard
        navigate('/');
      } catch (error) {
        console.error('Email confirmation error:', error);
        setIsProcessing(false);

        Swal.fire({
          icon: 'error',
          title: 'Confirmation Error',
          text: 'There was an error confirming your email. Please try signing in.',
          confirmButtonColor: '#2563eb'
        }).then(() => {
          navigate('/');
        });
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
}
