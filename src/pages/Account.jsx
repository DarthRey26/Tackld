import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Account = () => {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890'
  };

  const recentRequests = [
    { id: 1, service: 'Plumbing', date: '2023-03-15', status: 'Completed' },
    { id: 2, service: 'House Cleaning', date: '2023-03-20', status: 'Pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><span className="font-semibold">Name:</span> {user.name}</p>
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Phone:</span> {user.phone}</p>
            <Button className="bg-blue-500 hover:bg-blue-600">Edit Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">Recent Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recentRequests.map(request => (
                <li key={request.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">{request.service}</p>
                    <p className="text-sm text-gray-600">{request.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    request.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {request.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;