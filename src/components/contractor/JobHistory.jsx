
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Clock, Star, BarChart, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JobHistory = ({ completedJobs }) => {
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [earningsTab, setEarningsTab] = React.useState("all");
  
  // Calculate earnings stats
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
  const averageRating = completedJobs.length > 0 
    ? (completedJobs.reduce((sum, job) => sum + (job.rating || 5), 0) / completedJobs.length).toFixed(1) 
    : "N/A";
  
  // Get weeks and months for earnings breakdown
  const getCurrentWeekJobs = () => completedJobs.filter(job => {
    const jobDate = new Date(job.completedDate || job.date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    return jobDate >= weekStart;
  });
  
  const getCurrentMonthJobs = () => completedJobs.filter(job => {
    const jobDate = new Date(job.completedDate || job.date);
    const now = new Date();
    return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
  });
  
  const weeklyEarnings = getCurrentWeekJobs().reduce((sum, job) => sum + (job.price || 0), 0);
  const monthlyEarnings = getCurrentMonthJobs().reduce((sum, job) => sum + (job.price || 0), 0);

  return (
    <>
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">Completed Jobs</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
        </TabsList>
        
        {/* Completed Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-xl font-bold text-blue-600">Completed Jobs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 max-h-[300px] overflow-auto">
                {completedJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No completed jobs yet.</p>
                ) : (
                  completedJobs.map((job) => (
                    <Card 
                      key={job.id} 
                      className="p-4 hover:shadow-md transition-shadow border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{job.service}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{job.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>${job.price}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{job.completedDate || job.date}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-green-500">Completed</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedJob(job)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="text-xl font-bold text-green-600">Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-blue-50">
                  <h3 className="text-sm text-gray-500 mb-1">Total Earnings</h3>
                  <p className="text-2xl font-bold text-blue-600">${totalEarnings.toFixed(2)}</p>
                </Card>
                <Card className="p-4 bg-green-50">
                  <h3 className="text-sm text-gray-500 mb-1">This Week</h3>
                  <p className="text-2xl font-bold text-green-600">${weeklyEarnings.toFixed(2)}</p>
                </Card>
                <Card className="p-4 bg-purple-50">
                  <h3 className="text-sm text-gray-500 mb-1">This Month</h3>
                  <p className="text-2xl font-bold text-purple-600">${monthlyEarnings.toFixed(2)}</p>
                </Card>
              </div>
              
              <Tabs value={earningsTab} onValueChange={setEarningsTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Time</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <div className="space-y-2 max-h-[200px] overflow-auto">
                    {completedJobs.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No earnings data available.</p>
                    ) : (
                      completedJobs.map((job) => (
                        <div key={job.id} className="flex justify-between items-center p-2 border-b">
                          <div>
                            <p className="font-medium">{job.service}</p>
                            <p className="text-sm text-gray-500">{job.completedDate || job.date}</p>
                          </div>
                          <p className="text-green-600 font-semibold">${job.price}</p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="week" className="mt-4">
                  <div className="space-y-2 max-h-[200px] overflow-auto">
                    {getCurrentWeekJobs().length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No earnings this week.</p>
                    ) : (
                      getCurrentWeekJobs().map((job) => (
                        <div key={job.id} className="flex justify-between items-center p-2 border-b">
                          <div>
                            <p className="font-medium">{job.service}</p>
                            <p className="text-sm text-gray-500">{job.completedDate || job.date}</p>
                          </div>
                          <p className="text-green-600 font-semibold">${job.price}</p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="month" className="mt-4">
                  <div className="space-y-2 max-h-[200px] overflow-auto">
                    {getCurrentMonthJobs().length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No earnings this month.</p>
                    ) : (
                      getCurrentMonthJobs().map((job) => (
                        <div key={job.id} className="flex justify-between items-center p-2 border-b">
                          <div>
                            <p className="font-medium">{job.service}</p>
                            <p className="text-sm text-gray-500">{job.completedDate || job.date}</p>
                          </div>
                          <p className="text-green-600 font-semibold">${job.price}</p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-xl font-bold text-yellow-600">Reviews & Ratings</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-yellow-50 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold">{averageRating}</span>
                  <span className="text-sm text-gray-500">Average Rating</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{completedJobs.length}</span> completed jobs
                </div>
              </div>
              
              <div className="space-y-4 max-h-[200px] overflow-auto">
                {completedJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No reviews yet.</p>
                ) : (
                  completedJobs.map((job) => (
                    <Card key={job.id} className="p-3 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            {[...Array(job.rating || 5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          <p className="text-sm italic">"{job.feedback || 'Great service, very professional!'}"</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{job.customerName || 'Customer'}</span>
                            <span>|</span>
                            <span>{job.completedDate || job.date}</span>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">{job.service}</Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedJob.service}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>Location: {selectedJob.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>Date: {selectedJob.completedDate || selectedJob.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>Price: ${selectedJob.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Duration: {selectedJob.duration || '2 hours'}</span>
                    </div>
                  </div>
                </div>
                
                {selectedJob.additionalParts && selectedJob.additionalParts.length > 0 && (
                  <div>
                    <h4 className="font-medium">Additional Parts</h4>
                    <ul className="pl-4 space-y-1 mt-1">
                      {selectedJob.additionalParts.map((part, index) => (
                        <li key={index} className="text-sm flex justify-between">
                          <span>{part.name}</span>
                          <span>${part.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium">Job Notes</h4>
                  <p className="text-sm mt-1">
                    {selectedJob.notes || 'Service was completed successfully with no issues.'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Customer Feedback</h4>
                  {selectedJob.feedback ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-1">
                        {[...Array(selectedJob.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                      <p className="text-sm mt-1">{selectedJob.feedback}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No feedback provided yet.</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium">Earnings Breakdown</h4>
                  <div className="bg-gray-50 p-2 rounded mt-1">
                    <div className="flex justify-between text-sm">
                      <span>Base price:</span>
                      <span>${selectedJob.price}</span>
                    </div>
                    {selectedJob.additionalParts && selectedJob.additionalParts.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm mt-1">
                          <span>Additional parts:</span>
                          <span>${selectedJob.additionalParts.reduce((sum, part) => sum + Number(part.price), 0)}</span>
                        </div>
                        <div className="border-t mt-1 pt-1 flex justify-between font-medium">
                          <span>Total earned:</span>
                          <span>${selectedJob.price + selectedJob.additionalParts.reduce((sum, part) => sum + Number(part.price), 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobHistory;
