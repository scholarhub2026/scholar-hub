import Router from 'express';
import { createMentor, getMentors, updateMentor } from '../controllers/Mentor';




export const mentorRouter=Router();

mentorRouter.post('/',createMentor);
mentorRouter.get('/',getMentors);
mentorRouter.put('/:id',updateMentor);