import React, { useState } from 'react';
import { useNavigate } from 'react-router';

export default function Register() {
  const [name, set_name] = useState('');
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [confirm_password, set_confirm_password] = useState('');
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm_password) {
       console.error("Passwords do not match!");
       return;
    }
    // In a real app, this is where you call your API to register the user
    console.log("Submitting:", { name, email, password });
  };

  return (
    // The outer wrapper centers the card vertically and horizontally on the screen
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-(--page-bg) p-4">
      {/* Card */}
      
    </div>
  );
}