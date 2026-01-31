import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createContactSchema,
  updateContactSchema,
  userSearchSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "../validators/contact";

const prisma = new PrismaClient();

export async function listContacts(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const userId = req.user.id;

  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: {
      contact: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(contacts);
}

export async function createContact(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const parsed = createContactSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { contactUserId }: CreateContactInput = parsed.data;
  const userId = req.user.id;

  if (contactUserId === userId) throw new AppError("Cannot add yourself as contact", 400);

  const contactUser = await prisma.user.findUnique({
    where: { id: contactUserId },
    select: { id: true },
  });
  if (!contactUser) throw new AppError("User not found", 404);

  const existing = await prisma.contact.findUnique({
    where: { userId_contactUserId: { userId, contactUserId } },
  });
  if (existing) throw new AppError("Contact already exists", 409);

  const contact = await prisma.contact.create({
    data: { userId, contactUserId, status: "PENDING" },
    include: {
      contact: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
  });

  res.status(201).json(contact);
}

export async function updateContact(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const contactId = req.params.id;
  const parsed = updateContactSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const data: UpdateContactInput = parsed.data;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: req.user.id },
  });
  if (!contact) throw new AppError("Contact not found", 404);

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: { status: data.status },
    include: {
      contact: {
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
  });

  res.json(updated);
}

export async function deleteContact(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const contactId = req.params.id;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: req.user.id },
  });
  if (!contact) throw new AppError("Contact not found", 404);

  await prisma.contact.delete({ where: { id: contactId } });
  res.status(204).send();
}

export async function searchUsers(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Unauthorized", 401);
  const parsed = userSearchSchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const { q, limit } = parsed.data;
  const userId = req.user.id;

  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      status: true,
    },
    take: limit,
  });

  res.json(users);
}
