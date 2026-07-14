import Router from 'express';
import { createMentor, deleteMentor, getMentors, resendMentorCredentials, updateMentor, updateMentorAvailability } from '../controllers/Mentor';
import { requireAuth, requireRole } from '../middleware/auth';


export const mentorRouter=Router();

mentorRouter.get('/',getMentors); // public: mentor directory
mentorRouter.post('/', requireAuth, requireRole('ADMIN'), createMentor);
mentorRouter.post('/:id/resend-credentials', requireAuth, requireRole('ADMIN'), resendMentorCredentials);
mentorRouter.put('/:id/availability', requireAuth, requireRole('TUTOR','ADMIN'), updateMentorAvailability);
mentorRouter.put('/:id', requireAuth, requireRole('ADMIN','TUTOR'), updateMentor);
mentorRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteMentor);