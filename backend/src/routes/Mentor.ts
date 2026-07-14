import Router from 'express';
import { createMentor, getMentors, updateMentor, updateMentorAvailability } from '../controllers/Mentor';
import { requireAuth, requireRole } from '../middleware/auth';


export const mentorRouter=Router();

mentorRouter.get('/',getMentors); // public: mentor directory
mentorRouter.post('/', requireAuth, requireRole('ADMIN'), createMentor);
mentorRouter.put('/:id/availability', requireAuth, requireRole('TUTOR','ADMIN'), updateMentorAvailability);
mentorRouter.put('/:id', requireAuth, requireRole('ADMIN','TUTOR'), updateMentor);