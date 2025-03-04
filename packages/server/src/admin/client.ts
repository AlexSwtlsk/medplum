import { createReference } from '@medplum/core';
import {
  AccessPolicy,
  ClientApplication,
  IdentityProvider,
  Project,
  ProjectMembership,
  Reference,
} from '@medplum/fhirtypes';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { invalidRequest, sendOutcome } from '../fhir/outcomes';
import { Repository, systemRepo } from '../fhir/repo';
import { generateSecret } from '../oauth/keys';

export const createClientValidators = [body('name').notEmpty().withMessage('Client name is required')];

export async function createClientHandler(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendOutcome(res, invalidRequest(errors));
    return;
  }

  let project: Project;
  const { project: localsProject, repo } = res.locals as { project: Project; repo: Repository };
  if (localsProject.superAdmin) {
    project = { resourceType: 'Project', id: req.params.projectId };
  } else {
    project = localsProject;
  }

  const client = await createClient(repo, {
    ...req.body,
    project,
  });

  res.status(201).json(client);
}

export interface CreateClientRequest {
  readonly project: Project;
  readonly name: string;
  readonly description?: string;
  readonly redirectUri?: string;
  readonly accessPolicy?: Reference<AccessPolicy>;
  readonly identityProvider?: IdentityProvider;
}

export async function createClient(repo: Repository, request: CreateClientRequest): Promise<ClientApplication> {
  const client = await repo.createResource<ClientApplication>({
    meta: {
      project: request.project.id,
    },
    resourceType: 'ClientApplication',
    name: request.name,
    secret: generateSecret(32),
    description: request.description,
    redirectUri: request.redirectUri,
    identityProvider: request.identityProvider,
  });

  await systemRepo.createResource<ProjectMembership>({
    meta: {
      project: request.project.id,
    },
    resourceType: 'ProjectMembership',
    project: createReference(request.project),
    user: createReference(client),
    profile: createReference(client),
    accessPolicy: request.accessPolicy,
  });

  return client;
}
