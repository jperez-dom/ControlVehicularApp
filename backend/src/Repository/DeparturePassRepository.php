<?php

namespace App\Repository;

use App\Entity\DeparturePass;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DeparturePass>
 *
 * @method DeparturePass|null find($id, $lockMode = null, $lockVersion = null)
 * @method DeparturePass|null findOneBy(array $criteria, array $orderBy = null)
 * @method DeparturePass[]    findAll()
 * @method DeparturePass[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class DeparturePassRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DeparturePass::class);
    }

//    /**
//     * @return DeparturePass[] Returns an array of DeparturePass objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('d')
//            ->andWhere('d.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('d.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?DeparturePass
//    {
//        return $this->createQueryBuilder('d')
//            ->andWhere('d.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
