'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { contactsApi } from '@/lib/api';

interface ContactRequest {
  id: number;
  student_name: string;
  student_email: string;
  listing_title: string;
  listing_id: number;
  created_at: string;
}

export default function LandlordContactsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'landlord') {
        router.push('/');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!token) return;
      setIsLoading(true);
      const response = await contactsApi.getLandlordContacts(token);
      if (response.success && response.data) {
        setContacts(response.data as ContactRequest[]);
      }
      setIsLoading(false);
    };

    if (token) {
      fetchContacts();
    }
  }, [token]);

  if (authLoading || isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/landlord/dashboard">Dashboard</Link></li>
          <li className="breadcrumb-item active">Contact Requests</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Contact Requests</h1>
        <span className="badge bg-primary rounded-pill">{contacts.length} Total</span>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0">Student Name</th>
                  <th className="py-3 border-0">Email</th>
                  <th className="py-3 border-0">Listing Concerned</th>
                  <th className="py-3 border-0">Date Contacted</th>
                  <th className="px-4 py-3 border-0 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-4 py-3 fw-bold">{contact.student_name || 'Guest Student'}</td>
                      <td className="py-3">{contact.student_email}</td>
                      <td className="py-3 text-primary">
                        <Link href={`/listings/${contact.listing_id}`} className="text-decoration-none">
                          {contact.listing_title}
                        </Link>
                      </td>
                      <td className="py-3 text-muted">
                        {new Date(contact.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <a 
                          href={`mailto:${contact.student_email}`} 
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        >
                          Reply by Email
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="opacity-25" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                        </svg>
                      </div>
                      <h5>No contact requests yet</h5>
                      <p className="small mb-0">Students will appear here once they inquire about your listings.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
