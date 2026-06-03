import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let loadPromise;

export const loadFaceModels = () => {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }

  return loadPromise;
};

export const computeDescriptorFromFile = async (file) => {
  await loadFaceModels();

  const image = await faceapi.bufferToImage(file);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('Aucun visage détecté sur l\'image.');
  }

  return Array.from(detection.descriptor);
};

export const computeDescriptorsFromFiles = async (files) => {
  const descriptors = [];

  for (const file of files) {
    descriptors.push(await computeDescriptorFromFile(file));
  }

  return descriptors;
};

export const computeDescriptorFromVideo = async (videoElement) => {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error('Aucun visage détecté dans la caméra.');
  }

  return Array.from(detection.descriptor);
};

export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const filesToDataUrls = async (files) => {
  const list = Array.from(files).slice(0, 5);
  if (list.length !== 5) {
    throw new Error('Veuillez fournir exactement 5 photos.');
  }

  return Promise.all(list.map((f) => fileToDataUrl(f)));
};

import { internService, supervisorService, employeeService } from './api';

const createResourceWithFaceData = async (service, fields = {}, files = []) => {
  const photoFiles = Array.from(files).slice(0, 5);
  if (photoFiles.length !== 5) {
    throw new Error('Veuillez fournir exactement 5 photos.');
  }

  const photos = await filesToDataUrls(photoFiles);
  const face_descriptors = await computeDescriptorsFromFiles(photoFiles);

  const payload = {
    ...fields,
    photos,
    face_descriptors,
  };

  return service.create(payload);
};

export const createInternWithFaceData = (fields, files) => createResourceWithFaceData(internService, fields, files);
export const createSupervisorWithFaceData = (fields, files) => createResourceWithFaceData(supervisorService, fields, files);
export const createEmployeeWithFaceData = (fields, files) => createResourceWithFaceData(employeeService, fields, files);

export const updateResourceWithFaceData = async (service, id, fields = {}, files = []) => {
  const payload = { ...fields };

  if (files && files.length > 0) {
    const photoFiles = Array.from(files).slice(0, 5);
    const photos = await filesToDataUrls(photoFiles);
    const face_descriptors = await computeDescriptorsFromFiles(photoFiles);
    payload.photos = photos;
    payload.face_descriptors = face_descriptors;
  }

  return service.update(id, payload);
};

export const updateInternWithFaceData = (id, fields, files) => updateResourceWithFaceData(internService, id, fields, files);
export const updateSupervisorWithFaceData = (id, fields, files) => updateResourceWithFaceData(supervisorService, id, fields, files);
export const updateEmployeeWithFaceData = (id, fields, files) => updateResourceWithFaceData(employeeService, id, fields, files);
