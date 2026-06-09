import type {MockTest } from "@/types";
const mq = (id: string, text: string, opts: string[], ans: number, exp: string) => ({ id, q: text, options: opts, answer: ans, explanation: exp });

const genQs = (sub: string) => Array.from({length:25},(_,i)=>mq(sub+i,sub+" Q"+(i+1)+": Sample question for "+sub+"?",["A) "+sub,"B) "+sub,"C) "+sub,"D) "+sub],i%4,"Answer: "+(i%4)));
export const mockTests: MockTest[] = [
  { id:"ssc-cgl-mock-1", title:"SSC CGL Tier-I Mock Test", description:"SSC CGL Tier-I with negative marking", duration:60, total_questions:25, total_marks:50, negativeMarking:0.5, passingMarks:30, category:"SSC", questions:genQs("SSC CGL") },
  { id:"rrb-ntpc-mock-1", title:"RRB NTPC CBT-1 Mock Test", description:"RRB NTPC exam pattern", duration:90, total_questions:25, total_marks:50, negativeMarking:0.33, passingMarks:30, category:"Railway", questions:genQs("RRB NTPC") },
  { id:"up-police-mock-1", title:"UP Police Constable Mock Test", description:"UP Police exam pattern", duration:120, total_questions:25, total_marks:50, negativeMarking:0.25, passingMarks:25, category:"State Police", questions:genQs("UP Police") },
  { id:"ibps-po-mock-1", title:"IBPS PO Prelims Mock Test", description:"Banking PO prelims", duration:60, total_questions:25, total_marks:50, negativeMarking:0.25, passingMarks:25, category:"Banking", questions:genQs("IBPS PO") },
  { id:"ssc-gd-mock-1", title:"SSC GD Constable Mock Test", description:"SSC GD constable", duration:90, total_questions:25, total_marks:50, negativeMarking:0.25, passingMarks:25, category:"SSC", questions:genQs("SSC GD") },
  { id:"rrb-group-d-mock-1", title:"RRB Group D Mock Test", description:"RRB Group D level test", duration:90, total_questions:25, total_marks:25, negativeMarking:0.33, passingMarks:15, category:"Railway", questions:genQs("RRB Group D") },
  { id:"upsssc-pet-mock-1", title:"UPSSSC PET Mock Test", description:"UPSSSC PET prelims", duration:120, total_questions:25, total_marks:50, negativeMarking:0.25, passingMarks:25, category:"State", questions:genQs("UPSSSC PET") },
];

export const announcements = [
  { id:"a1", text:"SSC CGL 2025 Notification released - Apply before Oct 15", date:"2025-09-01", isNew:true },
  { id:"a2", text:"RRB NTPC CBT-1 dates announced - Nov 20 onwards", date:"2025-08-15", isNew:true },
  { id:"a3", text:"UP Police Constable 60244 vacancies - last date Aug 15", date:"2025-08-10", isNew:true },
  { id:"a4", text:"IBPS PO Prelims result declared - Mains in November", date:"2025-08-05", isNew:false },
  { id:"a5", text:"UPSC CAPF AC 2025 notification out", date:"2025-07-28", isNew:false },
];
export const bulletins = [
  { id:"b1", title:"SSC CGL 2025 Official Notification", date:"2025-09-01", description:"Full notification for SSC CGL 2025 with syllabus and exam pattern", link:"#", category:"SSC" },
  { id:"b2", title:"RRB NTPC CBT-1 Schedule Released", date:"2025-08-15", description:"RRB NTPC CBT-1 schedule with city intimation slip details", link:"#", category:"Railway" },
  { id:"b3", title:"UP Police Constable Admit Card", date:"2025-08-10", description:"Download UP Police Constable admit card from official website", link:"#", category:"State" },
  { id:"b4", title:"IBPS Calendar 2025-26 Released", date:"2025-08-01", description:"Complete IBPS exam calendar for 2025-26 with all dates", link:"#", category:"Banking" },
  { id:"b5", title:"UPSC CSE 2026 Notification", date:"2025-07-25", description:"UPSC Civil Services 2026 notification expected soon", link:"#", category:"UPSC" },
];
export const analyticsData = { totalUsers: 125000, totalTests: 850000, totalQuizzes: 2400000, totalDownloads: 540000 };
export const leaderboardData = [
  { name:"Aarav Sharma", score:980, badge:"🥇" },
  { name:"Priya Patel", score:945, badge:"🥈" },
  { name:"Rohan Singh", score:920, badge:"🥉" },
  { name:"Ananya Gupta", score:895 },
  { name:"Vikram Reddy", score:870 },
];
export const testimonialsData = [
  { name:"Aman Kumar", message:"This portal helped me crack SSC CGL in first attempt. The mock tests are exactly like real exam.", rating:5 },
  { name:"Sneha Verma", message:"Daily quiz kept my preparation consistent. Excellent study material and free PDFs.", rating:5 },
  { name:"Karan Mehta", message:"Best free platform for government exam preparation. Highly recommend to all aspirants.", rating:5 },
];
