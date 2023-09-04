import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { router, authedProcedure, publicProcedure } from '~/server/trpc';

export const authenticationRouter = router({
  registerNewAccount: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string().min(3),
        confirmPassword: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // console.log('ctx', ctx);
      // console.log('input', input);

      try {
        await ctx.prisma.account.create({
          data: {
            email: input.email,
            password: input.password,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          // The .code property can be accessed in a type-safe manner
          if (e.code === 'P2002') {
            console.log(
              'There is a unique constraint violation, a new user cannot be created with this email',
            );
          }
        }
        throw e;
      }
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.account.findMany();
  }),

  deleteAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.account.deleteMany();
  }),

  getSecretMessage: authedProcedure.query(() => {
    return 'you can now see this secret message!';
  }),
});
