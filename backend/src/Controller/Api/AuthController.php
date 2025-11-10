<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\UsersRepository;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    #[Route('/auth/login', name: 'auth_login', methods: ['POST'])]
    public function login(Request $request, UsersRepository $usersRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = $data['code'] ?? null;

        if (!$code) {
            return $this->json(['success' => false, 'error' => 'Código no proporcionado'], 400);
        }

        $user = $usersRepository->findOneBy(['codigo' => $code]);

        if (!$user) {
            return $this->json(['success' => false, 'error' => 'Código inválido'], 401);
        }

        return $this->json([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'nombre' => $user->getUser(),
                'email' => $user->getEmail(),
            ],
        ]);
    }
}
